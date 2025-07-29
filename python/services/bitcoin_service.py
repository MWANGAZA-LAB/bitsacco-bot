"""
Bitcoin Service
Handles Bitcoin operations, price tracking, and blockchain integration
"""

import aiohttp
import logging
from typing import Dict, Any, Optional
from decimal import Decimal
from ..config import settings

logger = logging.getLogger(__name__)


class BitcoinService:
    """Service for Bitcoin operations and price tracking"""
    
    def __init__(self):
        self.coingecko_api_key = settings.coingecko_api_key
        self.session: Optional[aiohttp.ClientSession] = None
        self.price_cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def initialize(self):
        """Initialize the service"""
        self.session = aiohttp.ClientSession()
        logger.info("Bitcoin Service initialized")
    
    async def health_check(self) -> str:
        """Check if the service is healthy"""
        try:
            if not self.session:
                return "not_initialized"
            
            # Test CoinGecko API connection
            async with self.session.get(
                "https://api.coingecko.com/api/v3/ping"
            ) as response:
                if response.status == 200:
                    return "healthy"
                return "unhealthy"
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return "error"
    
    async def get_current_price(self) -> Dict[str, Any]:
        """Get current Bitcoin price in USD and KES"""
        if not self.session:
            raise RuntimeError("Service not initialized")
        
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": "bitcoin",
                "vs_currencies": "usd,kes",
                "include_24hr_change": "true"
            }
            
            if self.coingecko_api_key:
                headers = {"x-cg-demo-api-key": self.coingecko_api_key}
            else:
                headers = {}
            
            async with self.session.get(
                url, 
                params=params, 
                headers=headers
            ) as response:
                response.raise_for_status()
                data = await response.json()
                
                bitcoin_data = data.get("bitcoin", {})
                
                return {
                    "usd": {
                        "price": bitcoin_data.get("usd", 0),
                        "change_24h": bitcoin_data.get("usd_24h_change", 0)
                    },
                    "kes": {
                        "price": bitcoin_data.get("kes", 0),
                        "change_24h": bitcoin_data.get("kes_24h_change", 0)
                    },
                    "timestamp": "now"
                }
        except Exception as e:
            logger.error(f"Failed to get Bitcoin price: {e}")
            raise
    
    async def send_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send a Bitcoin transaction (placeholder for https://bitsacco.com/ integration)"""
        # This would integrate with https://bitsacco.com/'s transaction API
        logger.info(f"Processing transaction: {transaction_data}")
        
        # Placeholder implementation
        return {
            "transaction_id": "placeholder_txid",
            "status": "pending",
            "amount": transaction_data.get("amount"),
            "recipient": transaction_data.get("recipient"),
            "fee": "0.0001"
        }
    
    async def get_transaction_status(self, tx_id: str) -> Dict[str, Any]:
        """Get transaction status"""
        # This would check transaction status via https://bitsacco.com/ API
        return {
            "transaction_id": tx_id,
            "status": "confirmed",
            "confirmations": 6
        }
    
    async def close(self):
        """Close the service"""
        if self.session:
            await self.session.close()
            logger.info("Bitcoin Service closed")
