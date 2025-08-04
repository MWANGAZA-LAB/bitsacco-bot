"""
Simplified Bitcoin Price Service - Professional Minimal Implementation
Single API call with basic error handling
"""

import httpx
from typing import Optional


class SimpleBitcoinPriceService:
    """Minimal Bitcoin price service for basic needs"""

    def __init__(self):
        self.api_url = "https://api.coingecko.com/api/v3/simple/price"
        self.timeout = 10.0

    async def get_current_price(self, currency: str = "usd") -> Optional[float]:
        """Get current Bitcoin price - simple and reliable"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.api_url, params={"ids": "bitcoin", "vs_currencies": currency}
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("bitcoin", {}).get(currency)
                return None
        except Exception:
            return None  # Fail silently, handle in calling code

    def format_price(self, price: Optional[float], currency: str = "USD") -> str:
        """Format price for display"""
        if price is None:
            return "Price unavailable"
        return f"₿ Bitcoin: ${price:,.2f} {currency.upper()}"


# Usage in your bot:
# price_service = SimpleBitcoinPriceService()
# price = await price_service.get_current_price()
# formatted = price_service.format_price(price)
