"""
Bitsacco API Client - Production-ready integration
Handles all API communication with Bitsacco.com backend
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
import httpx
from httpx import Timeout, Limits
import structlog

from ..config import settings

logger = structlog.get_logger(__name__)


class BitsaccoAPIClient:
    """Production-ready Bitsacco API client with retry logic and caching"""

    def __init__(self):
        self.base_url = settings.BITSACCO_API_URL.rstrip("/")
        self.api_key = settings.BITSACCO_API_KEY
        self.client: Optional[httpx.AsyncClient] = None

        # Request configuration
        self.timeout = Timeout(settings.BITSACCO_TIMEOUT)
        self.limits = Limits(max_keepalive_connections=5, max_connections=10)

        # Rate limiting and retry
        self.max_retries = 3
        self.retry_delay = 1.0

        # Health status
        self.is_healthy = False
        self.last_health_check = None

    async def initialize(self) -> None:
        """Initialize HTTP client with proper configuration"""
        try:
            self.client = httpx.AsyncClient(
                timeout=self.timeout,
                limits=self.limits,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": f"Bitsacco-WhatsApp-Bot/{settings.VERSION}",
                    "Accept": "application/json",
                },
            )

            # Perform initial health check
            await self.health_check()

            logger.info("✅ Bitsacco API client initialized")

        except Exception as e:
            logger.error("❌ Failed to initialize Bitsacco API client", error=str(e))
            raise

    async def health_check(self) -> Dict[str, Any]:
        """Check API health and connectivity"""
        try:
            response = await self._make_request("GET", "/health")

            if response and response.get("status") == "ok":
                self.is_healthy = True
                self.last_health_check = datetime.utcnow()
                return {"status": "healthy", "api_status": "operational"}
            else:
                self.is_healthy = False
                return {"status": "unhealthy", "api_status": "degraded"}

        except Exception as e:
            self.is_healthy = False
            logger.error("Bitsacco API health check failed", error=str(e))
            return {"status": "error", "error": str(e)}

    async def get_user_by_phone(self, phone_number: str) -> Dict[str, Any]:
        """Get user information by phone number"""
        try:
            endpoint = f"/users/phone/{phone_number}"
            response = await self._make_request("GET", endpoint)

            if response:
                return {
                    "exists": True,
                    "user_id": response.get("id"),
                    "phone_number": response.get("phone_number"),
                    "name": response.get("name"),
                    "kyc_level": response.get("kyc_level", "basic"),
                    "account_status": response.get("status", "active"),
                }
            else:
                return {"exists": False, "message": "User not found"}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"exists": False, "message": "User not found"}
            else:
                logger.error(
                    "Error fetching user by phone", error=str(e), phone=phone_number
                )
                raise

        except Exception as e:
            logger.error(
                "Unexpected error fetching user", error=str(e), phone=phone_number
            )
            raise

    async def send_otp(self, phone_number: str) -> Dict[str, Any]:
        """Send OTP to user's phone number"""
        try:
            payload = {
                "phone_number": phone_number,
                "action": "whatsapp_login",
                "channel": "sms",
            }

            response = await self._make_request("POST", "/auth/send-otp", json=payload)

            if response:
                return {
                    "success": True,
                    "message": "OTP sent successfully",
                    "expires_in": response.get("expires_in", 300),
                    "request_id": response.get("request_id"),
                }
            else:
                return {"success": False, "message": "Failed to send OTP"}

        except Exception as e:
            logger.error("Error sending OTP", error=str(e), phone=phone_number)
            return {"success": False, "message": f"Error: {str(e)}"}

    async def verify_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        """Verify OTP code"""
        try:
            payload = {
                "phone_number": phone_number,
                "otp_code": otp_code,
                "action": "whatsapp_login",
            }

            response = await self._make_request(
                "POST", "/auth/verify-otp", json=payload
            )

            if response and response.get("valid"):
                return {
                    "success": True,
                    "user_id": response.get("user_id"),
                    "access_token": response.get("access_token"),
                    "expires_in": response.get("expires_in", 3600),
                }
            else:
                return {
                    "success": False,
                    "message": response.get("message", "Invalid OTP"),
                }

        except Exception as e:
            logger.error("Error verifying OTP", error=str(e), phone=phone_number)
            return {"success": False, "message": f"Error: {str(e)}"}

    async def get_balance(self, user_id: str) -> Dict[str, Any]:
        """Get user's wallet balance"""
        try:
            endpoint = f"/users/{user_id}/balance"
            response = await self._make_request("GET", endpoint)

            if response:
                return {
                    "success": True,
                    "btc_balance": response.get("btc_balance", 0.0),
                    "kes_balance": response.get("kes_balance", 0.0),
                    "usd_balance": response.get("usd_balance", 0.0),
                    "last_updated": response.get("last_updated"),
                    "wallet_address": response.get("wallet_address"),
                }
            else:
                return {"success": False, "message": "Failed to fetch balance"}

        except Exception as e:
            logger.error("Error fetching balance", error=str(e), user_id=user_id)
            return {"success": False, "message": f"Error: {str(e)}"}

    async def initiate_bitcoin_savings(
        self, phone_number: str, amount_kes: float
    ) -> Dict[str, Any]:
        """Initiate Bitcoin savings transaction via M-Pesa"""
        try:
            payload = {
                "phone_number": phone_number,
                "amount_kes": amount_kes,
                "payment_method": "mpesa",
                "transaction_type": "bitcoin_savings",
                "currency": "KES",
            }

            response = await self._make_request(
                "POST", "/transactions/savings/initiate", json=payload
            )

            if response:
                return {
                    "success": True,
                    "transaction_id": response.get("transaction_id"),
                    "amount_kes": amount_kes,
                    "estimated_btc": response.get("estimated_btc"),
                    "exchange_rate": response.get("exchange_rate"),
                    "mpesa_reference": response.get("mpesa_reference"),
                    "status": response.get("status", "pending"),
                    "expires_at": response.get("expires_at"),
                }
            else:
                return {"success": False, "message": "Failed to initiate savings"}

        except Exception as e:
            logger.error(
                "Error initiating Bitcoin savings",
                error=str(e),
                phone=phone_number,
                amount=amount_kes,
            )
            return {"success": False, "message": f"Error: {str(e)}"}

    async def get_transaction_history(
        self, user_id: str, limit: int = 10, offset: int = 0
    ) -> Dict[str, Any]:
        """Get user's transaction history"""
        try:
            params = {"limit": limit, "offset": offset, "order": "desc"}
            endpoint = f"/users/{user_id}/transactions"

            response = await self._make_request("GET", endpoint, params=params)

            if response:
                return {
                    "success": True,
                    "transactions": response.get("transactions", []),
                    "total": response.get("total", 0),
                    "has_more": response.get("has_more", False),
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to fetch transaction history",
                }

        except Exception as e:
            logger.error(
                "Error fetching transaction history", error=str(e), user_id=user_id
            )
            return {"success": False, "message": f"Error: {str(e)}"}

    async def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Get status of specific transaction"""
        try:
            endpoint = f"/transactions/{transaction_id}/status"
            response = await self._make_request("GET", endpoint)

            if response:
                return {
                    "success": True,
                    "transaction_id": transaction_id,
                    "status": response.get("status"),
                    "amount_kes": response.get("amount_kes"),
                    "amount_btc": response.get("amount_btc"),
                    "created_at": response.get("created_at"),
                    "completed_at": response.get("completed_at"),
                    "blockchain_hash": response.get("blockchain_hash"),
                }
            else:
                return {"success": False, "message": "Transaction not found"}

        except Exception as e:
            logger.error(
                "Error fetching transaction status",
                error=str(e),
                transaction_id=transaction_id,
            )
            return {"success": False, "message": f"Error: {str(e)}"}

    async def update_user_preferences(
        self, user_id: str, preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user preferences"""
        try:
            endpoint = f"/users/{user_id}/preferences"
            response = await self._make_request("PATCH", endpoint, json=preferences)

            if response:
                return {
                    "success": True,
                    "preferences": response.get("preferences"),
                    "updated_at": response.get("updated_at"),
                }
            else:
                return {"success": False, "message": "Failed to update preferences"}

        except Exception as e:
            logger.error("Error updating preferences", error=str(e), user_id=user_id)
            return {"success": False, "message": f"Error: {str(e)}"}

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Make HTTP request with retry logic and error handling"""
        if not self.client:
            raise RuntimeError("API client not initialized")

        url = f"{self.base_url}{endpoint}"

        for attempt in range(self.max_retries + 1):
            try:
                logger.debug(
                    "Making API request",
                    method=method,
                    endpoint=endpoint,
                    attempt=attempt + 1,
                )

                response = await self.client.request(
                    method=method, url=url, json=json, params=params
                )

                # Log response details
                logger.debug(
                    "API response received",
                    status_code=response.status_code,
                    endpoint=endpoint,
                )

                # Handle different response codes
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 201:
                    return response.json()
                elif response.status_code == 204:
                    return {}
                elif response.status_code == 404:
                    return None
                elif response.status_code in [401, 403]:
                    logger.error(
                        "Authentication failed", status_code=response.status_code
                    )
                    raise httpx.HTTPStatusError(
                        message="Authentication failed",
                        request=response.request,
                        response=response,
                    )
                elif response.status_code >= 500:
                    # Server error - retry
                    if attempt < self.max_retries:
                        wait_time = self.retry_delay * (2**attempt)
                        logger.warning(
                            f"Server error, retrying in {wait_time}s",
                            status_code=response.status_code,
                            attempt=attempt + 1,
                        )
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        response.raise_for_status()
                else:
                    # Client error - don't retry
                    response.raise_for_status()

            except httpx.TimeoutException:
                if attempt < self.max_retries:
                    wait_time = self.retry_delay * (2**attempt)
                    logger.warning(
                        f"Request timeout, retrying in {wait_time}s",
                        endpoint=endpoint,
                        attempt=attempt + 1,
                    )
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error("Request timeout after all retries", endpoint=endpoint)
                    raise

            except httpx.NetworkError as e:
                if attempt < self.max_retries:
                    wait_time = self.retry_delay * (2**attempt)
                    logger.warning(
                        f"Network error, retrying in {wait_time}s",
                        error=str(e),
                        attempt=attempt + 1,
                    )
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error("Network error after all retries", error=str(e))
                    raise

            except Exception as e:
                logger.error(
                    "Unexpected error in API request", error=str(e), endpoint=endpoint
                )
                raise

        return None

    async def close(self) -> None:
        """Close HTTP client"""
        if self.client:
            await self.client.aclose()
            logger.info("Bitsacco API client closed")

    def __del__(self):
        """Cleanup on deletion"""
        if self.client:
            # Note: This won't work properly in async context
            # Proper cleanup should be done via close() method
            pass


# Alias for backward compatibility
BitsaccoAPIService = BitsaccoAPIClient
