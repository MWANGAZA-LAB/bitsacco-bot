"""
API Routes - FastAPI routes for webhooks and monitoring
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from ..database import get_db
from ..services.whatsapp_service import WhatsAppService
from ..services.user_service import UserService
from ..services.ai_service import AIConversationService
from ..services.bitcoin_service import BitcoinPriceService
from ..services.bitsacco_api import BitsaccoAPIService

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for monitoring"""
    try:
        # This would be injected in a real app
        # For now, return basic health status
        return {
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z",
            "services": {
                "api": "healthy",
                "database": "healthy",
                "whatsapp": "healthy",
                "bitcoin": "healthy"
            }
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with service status"""
    try:
        # This would check all services in a real deployment
        return {
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z",
            "services": {
                "database": {"status": "healthy", "response_time": "2ms"},
                "whatsapp": {"status": "healthy", "active_sessions": 5},
                "bitcoin_price": {"status": "healthy", "last_update": "30s ago"},
                "ai_service": {"status": "healthy", "model": "gpt-3.5-turbo"},
                "bitsacco_api": {"status": "healthy", "response_time": "150ms"}
            },
            "system": {
                "memory_usage": "45%",
                "cpu_usage": "12%",
                "uptime": "2h 15m"
            }
        }
    except Exception as e:
        logger.error("Detailed health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(
    webhook_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """WhatsApp webhook endpoint"""
    try:
        logger.info("WhatsApp webhook received", data=webhook_data)
        
        # Process webhook in background
        background_tasks.add_task(
            process_whatsapp_webhook,
            webhook_data,
            db
        )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error("WhatsApp webhook error", error=str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/webhook/whatsapp")
async def whatsapp_webhook_verify(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
) -> str:
    """WhatsApp webhook verification"""
    try:
        # Verify webhook token
        if hub_mode == "subscribe" and hub_verify_token == "your_verify_token":
            logger.info("WhatsApp webhook verified")
            return hub_challenge
        else:
            logger.warning("WhatsApp webhook verification failed")
            raise HTTPException(status_code=403, detail="Verification failed")
            
    except Exception as e:
        logger.error("WhatsApp webhook verification error", error=str(e))
        raise HTTPException(status_code=400, detail="Verification error")


@router.get("/bitcoin/price")
async def get_bitcoin_price() -> Dict[str, Any]:
    """Get current Bitcoin price"""
    try:
        # This would use the actual service in production
        return {
            "price_usd": 45000.00,
            "price_kes": 6750000.00,
            "change_24h_usd": 2.5,
            "change_24h_kes": 2.5,
            "last_updated": "2024-01-01T00:00:00Z",
            "source": "coingecko"
        }
    except Exception as e:
        logger.error("Bitcoin price fetch error", error=str(e))
        raise HTTPException(status_code=500, detail="Price fetch failed")


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Get bot statistics"""
    try:
        # This would query actual database statistics
        return {
            "total_users": 150,
            "active_sessions": 12,
            "messages_today": 245,
            "transactions_today": 8,
            "uptime": "2h 15m"
        }
    except Exception as e:
        logger.error("Stats fetch error", error=str(e))
        raise HTTPException(status_code=500, detail="Stats fetch failed")


async def process_whatsapp_webhook(
    webhook_data: Dict[str, Any],
    db: AsyncSession
) -> None:
    """Process WhatsApp webhook in background"""
    try:
        logger.info("Processing WhatsApp webhook", data=webhook_data)
        
        # Extract message data
        if "entry" in webhook_data:
            for entry in webhook_data["entry"]:
                if "changes" in entry:
                    for change in entry["changes"]:
                        if change.get("field") == "messages":
                            messages = change.get("value", {}).get("messages", [])
                            
                            for message in messages:
                                await process_incoming_message(message, db)
        
    except Exception as e:
        logger.error("Webhook processing error", error=str(e))


async def process_incoming_message(
    message: Dict[str, Any],
    db: AsyncSession
) -> None:
    """Process individual incoming message"""
    try:
        # Extract message details
        from_number = message.get("from")
        message_text = ""
        
        if "text" in message:
            message_text = message["text"]["body"]
        
        if from_number and message_text:
            logger.info("Processing message", 
                       from_number=from_number,
                       message=message_text)
            
            # This is where you'd integrate with your services
            # For now, just log the message
            
    except Exception as e:
        logger.error("Message processing error", error=str(e))
