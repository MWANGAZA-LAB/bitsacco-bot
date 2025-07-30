"""
Webhook API routes for Bitsacco WhatsApp Bot
Handles incoming webhook events and notifications
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import structlog

from ...config import settings

logger = structlog.get_logger(__name__)

webhook_router = APIRouter(tags=["Webhooks"])


@webhook_router.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request) -> Dict[str, str]:
    """Handle incoming WhatsApp webhook events"""
    try:
        payload = await request.json()
        logger.info("WhatsApp webhook received", payload=payload)

        # Process webhook payload here
        # This is where you'd handle incoming message events

        return {"status": "received"}
    except Exception as e:
        logger.error("Error processing WhatsApp webhook", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")


@webhook_router.post("/webhooks/bitsacco")
async def bitsacco_webhook(request: Request) -> Dict[str, str]:
    """Handle incoming Bitsacco API webhook events"""
    try:
        payload = await request.json()
        logger.info("Bitsacco webhook received", payload=payload)

        # Process Bitsacco events (transactions, account updates, etc.)

        return {"status": "received"}
    except Exception as e:
        logger.error("Error processing Bitsacco webhook", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")


@webhook_router.get("/webhooks/test")
async def test_webhook() -> Dict[str, str]:
    """Test webhook endpoint for development"""
    return {"message": "Webhook endpoint is working"}
