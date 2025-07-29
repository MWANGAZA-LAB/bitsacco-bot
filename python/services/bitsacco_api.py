"""
Bitsacco API Service
Handles integration with https://bitsacco.com/ services
"""

import aiohttp
import logging
from typing import Dict, Any, List, Optional
from ..config import settings

logger = logging.getLogger(__name__)

class BitsaccoAPIService:
    """Service for interacting with https://bitsacco.com/ API"""
    
    def __init__(self):
        self.api_url = settings.bitsacco_api_url
        self.api_key = settings.bitsacco_api_key
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def initialize(self):
        """Initialize the HTTP session"""
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
        logger.info("Bitsacco API Service initialized")
    
    async def health_check(self) -> str:
        """Check if the service is healthy"""
        try:
            if not self.session:
                return "not_initialized"
            
            async with self.session.get(f"{self.api_url}/health") as response:
                if response.status == 200:
                    return "healthy"
                return "unhealthy"
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return "error"
    
    async def register_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new user with https://bitsacco.com/"""
        if not self.session:
            raise RuntimeError("Service not initialized")
        
        try:
            async with self.session.post(
                f"{self.api_url}/users/register",
                json=user_data
            ) as response:
                response.raise_for_status()
                return await response.json()
        except Exception as e:
            logger.error(f"User registration failed: {e}")
            raise
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile from https://bitsacco.com/"""
        if not self.session:
            raise RuntimeError("Service not initialized")
        
        try:
            async with self.session.get(
                f"{self.api_url}/users/{user_id}"
            ) as response:
                response.raise_for_status()
                return await response.json()
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            raise
    
    async def get_user_transactions(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user transaction history"""
        if not self.session:
            raise RuntimeError("Service not initialized")
        
        try:
            async with self.session.get(
                f"{self.api_url}/users/{user_id}/transactions",
                params={"limit": limit}
            ) as response:
                response.raise_for_status()
                data = await response.json()
                return data.get("transactions", [])
        except Exception as e:
            logger.error(f"Failed to get transactions: {e}")
            raise
    
    async def update_user_preferences(
        self, 
        user_id: str, 
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user preferences"""
        if not self.session:
            raise RuntimeError("Service not initialized")
        
        try:
            async with self.session.patch(
                f"{self.api_url}/users/{user_id}/preferences",
                json=preferences
            ) as response:
                response.raise_for_status()
                return await response.json()
        except Exception as e:
            logger.error(f"Failed to update preferences: {e}")
            raise
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            logger.info("Bitsacco API Service closed")
