"""
API Routes package for Bitsacco WhatsApp Bot
"""

from fastapi import APIRouter
from .health import health_router
from .webhooks import webhook_router
from .users import users_router
from .admin import admin_router

# Create main router that includes all sub-routers
router = APIRouter()

# Include all route modules
router.include_router(health_router, prefix="/api")
router.include_router(webhook_router, prefix="/api")
router.include_router(users_router, prefix="/api")
router.include_router(admin_router, prefix="/api")

__all__ = [
    "router",
    "health_router",
    "webhook_router",
    "users_router",
    "admin_router",
]
