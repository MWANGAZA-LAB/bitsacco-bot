"""
Wallet Service - Bitsacco API Client
Interfaces with https://bitsacco.com/ API for wallet operations
"""

import logging
import httpx
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger(__name__)


class WalletService:
    """Client service for Bitsacco.com wallet API"""
    
    def __init__(self):
        self.api_base_url = settings.BITSACCO_API_URL
        self.api_key = settings.BITSACCO_API_KEY
    
    async def initialize(self):
        """Initialize the wallet service"""
        logger.info("Wallet API Client initialized")
    
    async def health_check(self) -> str:
        """Check if the Bitsacco API is healthy"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_base_url}/health")
                return "healthy" if response.status_code == 200 else "unhealthy"
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return "unhealthy"
    
    async def get_user_by_phone(self, phone_number: str) -> Dict[str, Any]:
        """Get user account from Bitsacco using phone number"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base_url}/users/phone/{phone_number}",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )

                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    return {"exists": False, "message": "User not found"}
                else:
                    response.raise_for_status()
                    return {"exists": False, "message": "Unexpected error"}
        except Exception as e:
            logger.error(f"Failed to get user by phone: {e}")
            return {"exists": False, "message": f"Exception occurred: {str(e)}"}
    
    async def get_balance(self, phone_number: str) -> Dict[str, Any]:
        """Get wallet balance from Bitsacco API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base_url}/users/phone/{phone_number}/balance",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            raise
    
    async def initiate_bitcoin_savings(
        self, 
        phone_number: str, 
        amount_kes: float
    ) -> Dict[str, Any]:
        """Initiate Bitcoin savings transaction via Bitsacco API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base_url}/transactions/save-bitcoin",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "phone_number": phone_number,
                        "amount_kes": amount_kes,
                        "payment_method": "mpesa"
                    }
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Failed to initiate savings: {e}")
            raise
    
    async def get_transaction_history(
        self, 
        phone_number: str, 
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get transaction history from Bitsacco API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base_url}/users/phone/{phone_number}/transactions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    params={"limit": limit}
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Failed to get transaction history: {e}")
            raise
    
    async def close(self):
        """Close the service"""
        logger.info("Wallet API Client closed")
