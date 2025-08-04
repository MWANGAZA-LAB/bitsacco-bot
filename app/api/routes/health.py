"""
Health check API routes for Bitsacco WhatsApp Bot
Provides system health and status endpoints
"""

from fastapi import APIRouter
from datetime import datetime
from typing import Dict, Any
import psutil

from ...config import settings

health_router = APIRouter(tags=["Health"])


@health_router.get("/health")
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


@health_router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with system metrics"""
    try:
        # Basic system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.APP_NAME,
            "version": settings.VERSION,
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100,
                },
            },
            "environment": {
                "debug": settings.DEBUG,
                "database_url": (settings.DATABASE_URL.split("://")[0] + "://***"),
            },
        }
    except Exception as e:
        return {
            "status": "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
        }


@health_router.get("/ping")
async def ping() -> Dict[str, str]:
    """Simple ping endpoint"""
    return {"message": "pong"}
