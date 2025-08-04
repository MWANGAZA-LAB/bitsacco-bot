"""
Simplified FastAPI app for testing - without lifespan complexity
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict, Any

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
        }

    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "name": "Bitsacco WhatsApp Bot",
            "version": "3.0.0-test",
            "status": "operational",
        }

    return app


# Create app for testing
app = create_test_app()
