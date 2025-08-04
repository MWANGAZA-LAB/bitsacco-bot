"""
API Tests - Test FastAPI routes and endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_health_check(self, test_client: TestClient):
        """Test basic health check"""
        response = test_client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "services" in data

    def test_detailed_health_check(self, test_client: TestClient):
        """Test detailed health check"""
        response = test_client.get("/health/detailed")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        assert "system" in data


class TestWhatsAppWebhook:
    """Test WhatsApp webhook endpoints"""

    def test_webhook_verification(self, test_client: TestClient):
        """Test webhook verification"""
        params = {
            "hub.mode": "subscribe",
            "hub.challenge": "test_challenge",
            "hub.verify_token": "your_verify_token",
        }

        response = test_client.get("/webhook/whatsapp", params=params)
        assert response.status_code == 200
        assert response.text == '"test_challenge"'

    def test_webhook_verification_invalid_token(self, test_client: TestClient):
        """Test webhook verification with invalid token"""
        params = {
            "hub.mode": "subscribe",
            "hub.challenge": "test_challenge",
            "hub.verify_token": "invalid_token",
        }

        response = test_client.get("/webhook/whatsapp", params=params)
        assert response.status_code == 403

    def test_webhook_message(
        self, test_client: TestClient, mock_whatsapp_message
    ):
        """Test incoming webhook message"""
        response = test_client.post(
            "/webhook/whatsapp", json=mock_whatsapp_message
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "received"


class TestBitcoinAPI:
    """Test Bitcoin price API"""

    def test_get_bitcoin_price(self, test_client: TestClient):
        """Test Bitcoin price endpoint"""
        response = test_client.get("/bitcoin/price")
        assert response.status_code == 200

        data = response.json()
        assert "price_usd" in data
        assert "price_kes" in data
        assert "change_24h_usd" in data
        assert "last_updated" in data


class TestStatsAPI:
    """Test statistics API"""

    def test_get_stats(self, test_client: TestClient):
        """Test stats endpoint"""
        response = test_client.get("/stats")
        assert response.status_code == 200

        data = response.json()
        assert "total_users" in data
        assert "active_sessions" in data
        assert "messages_today" in data


@pytest.mark.asyncio
class TestAsyncEndpoints:
    """Test async endpoints"""

    async def test_async_health_check(self, async_client: AsyncClient):
        """Test health check with async client"""
        response = await async_client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
