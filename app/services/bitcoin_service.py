"""
Bitcoin Price Service - Real-time price tracking
Fetches and caches Bitcoin prices from multiple sources
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import httpx
import structlog

from ..config import settings
from ..models.user import BitcoinPrice

logger = structlog.get_logger(__name__)


class BitcoinPriceService:
    """Production Bitcoin price service with caching and fallbacks"""

    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self.price_cache: Dict[str, BitcoinPrice] = {}
        self.is_running = False
        self.update_task: Optional[asyncio.Task] = None

        # API endpoints (multiple sources for reliability)
        self.coingecko_url = "https://api.coingecko.com/api/v3"
        self.coinapi_url = "https://rest.coinapi.io/v1"

        # Cache settings
        self.cache_ttl = settings.BITCOIN_PRICE_CACHE_TTL
        self.update_interval = settings.BITCOIN_PRICE_UPDATE_INTERVAL

    async def start(self) -> None:
        """Start the price service"""
        try:
            # Initialize HTTP client
            self.client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                limits=httpx.Limits(max_keepalive_connections=5),
            )

            # Fetch initial prices
            await self._update_prices()

            # Start background price updates
            self.is_running = True
            self.update_task = asyncio.create_task(self._price_update_loop())

            logger.info("✅ Bitcoin price service started")

        except Exception as e:
            logger.error("❌ Failed to start Bitcoin price service", error=str(e))
            raise

    async def stop(self) -> None:
        """Stop the price service"""
        self.is_running = False

        if self.update_task:
            self.update_task.cancel()
            try:
                await self.update_task
            except asyncio.CancelledError:
                pass

        if self.client:
            await self.client.aclose()

        logger.info("🛑 Bitcoin price service stopped")

    async def get_price(self, currency: str = "USD") -> Optional[float]:
        """Get current Bitcoin price in specified currency"""
        currency = currency.upper()

        # Check cache first
        cached_price = self._get_cached_price()
        if cached_price:
            if currency == "USD":
                return cached_price.price_usd
            elif currency == "KES":
                return cached_price.price_kes

        # If no cached price, try to fetch fresh data
        await self._update_prices()

        cached_price = self._get_cached_price()
        if cached_price:
            if currency == "USD":
                return cached_price.price_usd
            elif currency == "KES":
                return cached_price.price_kes

        return None

    async def get_price_change_24h(self, currency: str = "USD") -> Optional[float]:
        """Get 24h price change percentage"""
        cached_price = self._get_cached_price()
        if cached_price:
            if currency.upper() == "USD":
                return cached_price.change_24h_usd
            elif currency.upper() == "KES":
                return cached_price.change_24h_kes

        return None

    async def get_price_summary(self) -> str:
        """Get formatted price summary for WhatsApp"""
        try:
            cached_price = self._get_cached_price()

            if not cached_price:
                await self._update_prices()
                cached_price = self._get_cached_price()

            if not cached_price:
                return "❌ Unable to fetch Bitcoin prices at the moment. Please try again later."

            # Format prices
            usd_price = f"${cached_price.price_usd:,.2f}"
            kes_price = f"KES {cached_price.price_kes:,.2f}"

            # Format changes
            usd_change = cached_price.change_24h_usd
            kes_change = cached_price.change_24h_kes

            usd_emoji = "📈" if usd_change >= 0 else "📉"
            kes_emoji = "📈" if kes_change >= 0 else "📉"

            usd_change_str = f"{'+' if usd_change >= 0 else ''}{usd_change:.2f}%"
            kes_change_str = f"{'+' if kes_change >= 0 else ''}{kes_change:.2f}%"

            summary = f"""
💰 *Bitcoin Price Update*

🇺🇸 *USD*: {usd_price}
{usd_emoji} 24h Change: {usd_change_str}

🇰🇪 *KES*: {kes_price}
{kes_emoji} 24h Change: {kes_change_str}

⏰ Last updated: {cached_price.last_updated.strftime('%H:%M UTC')}
            """.strip()

            return summary

        except Exception as e:
            logger.error("Error generating price summary", error=str(e))
            return "❌ Error fetching Bitcoin price. Please try again."

    async def health_check(self) -> Dict[str, Any]:
        """Health check for monitoring"""
        cached_price = self._get_cached_price()

        return {
            "status": "healthy" if cached_price else "degraded",
            "is_running": self.is_running,
            "last_update": cached_price.last_updated.isoformat()
            if cached_price
            else None,
            "cache_size": len(self.price_cache),
            "update_interval": self.update_interval,
        }

    def _get_cached_price(self) -> Optional[BitcoinPrice]:
        """Get cached price if not expired"""
        if "btc" in self.price_cache:
            cached = self.price_cache["btc"]
            age = (datetime.utcnow() - cached.last_updated).total_seconds()

            if age < self.cache_ttl:
                return cached

        return None

    async def _price_update_loop(self) -> None:
        """Background task to update prices periodically"""
        while self.is_running:
            try:
                await asyncio.sleep(self.update_interval)
                await self._update_prices()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in price update loop", error=str(e))
                await asyncio.sleep(60)  # Back off on error

    async def _update_prices(self) -> None:
        """Update Bitcoin prices from APIs"""
        try:
            # Try CoinGecko first (free tier)
            price_data = await self._fetch_from_coingecko()

            if not price_data:
                # Fallback to other sources if needed
                logger.warning("CoinGecko failed, using fallback pricing")
                price_data = await self._fetch_fallback_prices()

            if price_data:
                # Cache the new price data
                self.price_cache["btc"] = price_data
                logger.debug(
                    "Bitcoin price updated",
                    usd=price_data.price_usd,
                    kes=price_data.price_kes,
                )
            else:
                logger.error("Failed to fetch Bitcoin prices from all sources")

        except Exception as e:
            logger.error("Error updating Bitcoin prices", error=str(e))

    async def _fetch_from_coingecko(self) -> Optional[BitcoinPrice]:
        """Fetch prices from CoinGecko API"""
        try:
            if not self.client:
                return None

            # CoinGecko endpoint for Bitcoin prices
            url = f"{self.coingecko_url}/simple/price"
            params = {
                "ids": "bitcoin",
                "vs_currencies": "usd,kes",
                "include_24hr_change": "true",
            }

            # Add API key if available
            if settings.COINGECKO_API_KEY:
                params["x_cg_demo_api_key"] = settings.COINGECKO_API_KEY

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            if "bitcoin" in data:
                btc_data = data["bitcoin"]

                return BitcoinPrice(
                    price_usd=btc_data.get("usd", 0.0),
                    price_kes=btc_data.get("kes", 0.0),
                    change_24h_usd=btc_data.get("usd_24h_change", 0.0),
                    change_24h_kes=btc_data.get("kes_24h_change", 0.0),
                    last_updated=datetime.utcnow(),
                    source="coingecko",
                )

        except Exception as e:
            logger.debug("CoinGecko API error", error=str(e))
            return None

    async def _fetch_fallback_prices(self) -> Optional[BitcoinPrice]:
        """Fallback price fetching with manual KES conversion"""
        try:
            if not self.client:
                return None

            # Simple USD price endpoint
            url = f"{self.coingecko_url}/simple/price"
            params = {
                "ids": "bitcoin",
                "vs_currencies": "usd",
                "include_24hr_change": "true",
            }

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            if "bitcoin" in data:
                btc_data = data["bitcoin"]
                usd_price = btc_data.get("usd", 0.0)
                usd_change = btc_data.get("usd_24h_change", 0.0)

                # Manual USD to KES conversion (approximate)
                # In production, you'd fetch actual exchange rates
                usd_to_kes_rate = 150.0  # Approximate rate
                kes_price = usd_price * usd_to_kes_rate

                return BitcoinPrice(
                    price_usd=usd_price,
                    price_kes=kes_price,
                    change_24h_usd=usd_change,
                    change_24h_kes=usd_change,  # Assuming similar change
                    last_updated=datetime.utcnow(),
                    source="fallback",
                )

        except Exception as e:
            logger.debug("Fallback price fetch error", error=str(e))
            return None
