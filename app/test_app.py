"""
Simplified FastAPI app for testing - without lifespan complexity
"""

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict, Any, Optional

from .config import settings


def create_test_app() -> FastAPI:
    """Create a simplified FastAPI app for testing"""

    app = FastAPI(
        title="Bitsacco WhatsApp Bot - Test",
        description="Test version without complex lifespan",
        version="3.0.0-test",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Simplified for testing
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check() -> Dict[str, Any]:
        """Basic health check endpoint"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.APP_NAME,
            "version": settings.VERSION,
            "services": {
                "api": "healthy",
                "database": "healthy",
                "whatsapp": "healthy",
                "bitcoin_api": "healthy",
            },
        }

    @app.get("/health/detailed")
    async def detailed_health_check() -> Dict[str, Any]:
        """Detailed health check"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "healthy",
                "whatsapp": "healthy",
                "bitcoin_api": "healthy",
            },
            "system": {
                "memory_usage": "45%",
                "cpu_usage": "12%",
                "uptime": "2h 15m",
            },
        }

    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "name": "Bitsacco WhatsApp Bot",
            "version": "3.0.0-test",
            "status": "operational",
        }

    # Webhook endpoints
    @app.get("/webhook/whatsapp")
    async def whatsapp_webhook_verify(
        hub_mode: Optional[str] = Query(None, alias="hub.mode"),
        hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
        hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
    ) -> str:
        """WhatsApp webhook verification"""
        if hub_mode == "subscribe" and hub_verify_token == "your_verify_token":
            return hub_challenge
        else:
            raise HTTPException(status_code=403, detail="Verification failed")

    @app.post("/webhook/whatsapp")
    async def whatsapp_webhook(request: Request) -> Dict[str, str]:
        """Handle incoming WhatsApp webhook events"""
        return {"status": "received"}

    # Bitcoin price endpoint
    @app.get("/bitcoin/price")
    async def get_bitcoin_price() -> Dict[str, Any]:
        """Get current Bitcoin price"""
        return {
            "price_usd": 45000.00,
            "price_kes": 6750000.00,
            "change_24h_usd": 2.5,
            "change_24h_kes": 2.5,
            "last_updated": datetime.utcnow().isoformat(),
            "source": "coingecko",
        }

    # Stats endpoint
    @app.get("/stats")
    async def get_stats() -> Dict[str, Any]:
        """Get bot statistics"""
        return {
            "total_users": 150,
            "active_sessions": 12,
            "messages_today": 245,
            "transactions_today": 8,
            "uptime": "2h 15m",
        }

    return app


# Create app for testing
app = create_test_app()
