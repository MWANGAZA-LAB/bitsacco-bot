"""
Bitsacco WhatsApp Bot - Python Only Implementation
Production-ready Bitcoin SACCO WhatsApp integration

Author: Professional Engineering Team
Version: 3.0.0 - Python Only Rewrite
Date: July 2025
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import structlog
import asyncio
from typing import Dict, Any

from .config import settings
from .database.session import DatabaseManager
from .services.whatsapp_service import WhatsAppService
from .services.bitsacco_api import BitsaccoAPIClient
from .services.simple_bitcoin_service import SimpleBitcoinPriceService
from .services.ai_service import AIConversationService
from .services.user_service import UserService
from .api.routes.health import health_router
from .api.routes.webhooks import webhook_router
from .api.routes.users import users_router
from .utils.logging import setup_logging

# Configure structured logging
logger = structlog.get_logger(__name__)

# Global service instances
services: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown"""
    # Startup
    logger.info("🚀 Starting Bitsacco WhatsApp Bot")

    # Initialize database
    db_manager = DatabaseManager()
    await db_manager.initialize()
    services["database"] = db_manager

    # Initialize services
    services["bitcoin_price"] = SimpleBitcoinPriceService()
    services["bitsacco_api"] = BitsaccoAPIClient()
    services["ai_conversation"] = AIConversationService()
    services["user_service"] = UserService(db_manager.get_session)

    # Initialize WhatsApp service (this will handle QR code scanning)
    whatsapp_service = WhatsAppService(
        bitsacco_api=services["bitsacco_api"],
        ai_service=services["ai_conversation"],
        user_service=services["user_service"],
        bitcoin_service=services["bitcoin_price"],
    )
    services["whatsapp"] = whatsapp_service

    # Start background services
    # Note: SimpleBitcoinPriceService doesn't need start/stop lifecycle
    await services["bitsacco_api"].initialize()
    await services["ai_conversation"].initialize()

    # Start WhatsApp bot
    await whatsapp_service.initialize()

    logger.info("✅ All services initialized successfully")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Bitsacco WhatsApp Bot")

    # Stop services gracefully
    if "whatsapp" in services:
        await services["whatsapp"].stop()
    # Note: SimpleBitcoinPriceService doesn't need cleanup
    if "bitsacco_api" in services:
        await services["bitsacco_api"].close()
    if "database" in services:
        await services["database"].close()

    logger.info("✅ Shutdown complete")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title="Bitsacco WhatsApp Bot",
        description="Production-ready Bitcoin SACCO WhatsApp integration",
        version="3.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # Security middleware
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router, tags=["Health"])
    app.include_router(webhook_router, prefix="/webhooks", tags=["Webhooks"])
    app.include_router(users_router, prefix="/api/users", tags=["Users"])

    @app.get("/")
    async def root():
        """Root endpoint with bot information"""
        return {
            "name": "Bitsacco WhatsApp Bot",
            "version": "3.0.0",
            "description": "Bitcoin SACCO WhatsApp integration",
            "status": "operational",
            "architecture": "Python-only production implementation",
        }

    @app.get("/status")
    async def status():
        """Detailed service status"""
        status_info = {
            "services": {},
            "timestamp": structlog.stdlib.datetime.datetime.utcnow().isoformat(),
        }

        for service_name, service in services.items():
            try:
                if hasattr(service, "health_check"):
                    status_info["services"][service_name] = await service.health_check()
                else:
                    status_info["services"][service_name] = "running"
            except Exception as e:
                status_info["services"][service_name] = f"error: {str(e)}"

        return status_info

    return app


# Create app instance
app = create_app()


def get_service(service_name: str):
    """Dependency to get service instances"""

    def _get_service():
        if service_name not in services:
            raise HTTPException(
                status_code=503, detail=f"Service {service_name} not available"
            )
        return services[service_name]

    return _get_service


# Dependency aliases for easy injection
get_whatsapp_service = get_service("whatsapp")
get_bitsacco_api = get_service("bitsacco_api")
get_user_service = get_service("user_service")
get_ai_service = get_service("ai_conversation")
get_bitcoin_service = get_service("bitcoin_price")


if __name__ == "__main__":
    # Setup logging
    setup_logging()

    # Run with uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1,  # WhatsApp session requires single worker
        log_config=None,  # Use our custom logging
        access_log=settings.DEBUG,
    )
