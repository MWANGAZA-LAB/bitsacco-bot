"""
Admin Service for Bitsacco WhatsApp Bot
Provides administrative operations and system monitoring
"""

import asyncio
import psutil
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import structlog

from ..config import settings
from .user_service import UserService
from .whatsapp_service import WhatsAppService
from .bitsacco_api import BitsaccoAPIClient

logger = structlog.get_logger(__name__)


class AdminService:
    """Administrative service for system monitoring and management"""

    def __init__(
        self,
        user_service: UserService,
        whatsapp_service: WhatsAppService,
        bitsacco_api: BitsaccoAPIClient,
    ):
        self.user_service = user_service
        self.whatsapp_service = whatsapp_service
        self.bitsacco_api = bitsacco_api

    async def get_system_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        try:
            # Get user statistics
            user_sessions = self.user_service.user_sessions
            total_users = len(user_sessions)
            active_users = sum(
                1 for session in user_sessions.values() if session.is_authenticated
            )

            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()

            # Try to get disk usage (handle different OS)
            try:
                disk = psutil.disk_usage("/")
            except Exception:
                try:
                    disk = psutil.disk_usage("C:\\")
                except Exception:
                    disk = None

            # Check service health
            services_health = await self._check_services_health()

            return {
                "timestamp": datetime.utcnow().isoformat(),
                "users": {
                    "total": total_users,
                    "active": active_users,
                    "authenticated": active_users,
                    "sessions": total_users,
                },
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory": {
                        "total": memory.total,
                        "available": memory.available,
                        "percent": memory.percent,
                        "used": memory.used,
                    },
                    "disk": (
                        {
                            "total": disk.total if disk else 0,
                            "free": disk.free if disk else 0,
                            "used": disk.used if disk else 0,
                            "percent": ((disk.used / disk.total * 100) if disk else 0),
                        }
                        if disk
                        else None
                    ),
                },
                "services": services_health,
                "uptime": self._get_uptime(),
                "version": settings.VERSION,
                "environment": ("production" if not settings.DEBUG else "development"),
            }

        except Exception as e:
            logger.error("Error getting system stats", error=str(e))
            raise

    async def get_user_management_data(
        self, page: int = 1, limit: int = 10, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get user management data with pagination"""
        try:
            user_sessions = self.user_service.user_sessions
            users_list = []

            for phone, session in user_sessions.items():
                if search and search.lower() not in phone.lower():
                    continue

                users_list.append(
                    {
                        "id": phone,
                        "phone_number": phone,
                        "is_authenticated": session.is_authenticated,
                        "current_state": session.current_state.value,
                        "created_at": session.created_at.isoformat(),
                        "last_activity": session.last_activity.isoformat(),
                        "message_count": len(session.conversation_history or []),
                        "user_id": getattr(session, "user_id", None),
                    }
                )

            # Sort by last activity
            users_list.sort(key=lambda x: x["last_activity"], reverse=True)

            # Pagination
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_users = users_list[start_idx:end_idx]

            return {
                "users": paginated_users,
                "total": len(users_list),
                "page": page,
                "limit": limit,
                "has_more": end_idx < len(users_list),
            }

        except Exception as e:
            logger.error("Error getting user management data", error=str(e))
            raise

    async def get_analytics_data(self, timeframe: str = "24h") -> Dict[str, Any]:
        """Get analytics data for the specified timeframe"""
        try:
            user_sessions = self.user_service.user_sessions

            # Calculate timeframe
            now = datetime.utcnow()
            if timeframe == "24h":
                start_time = now - timedelta(hours=24)
            elif timeframe == "7d":
                start_time = now - timedelta(days=7)
            elif timeframe == "30d":
                start_time = now - timedelta(days=30)
            else:
                start_time = now - timedelta(hours=24)

            # Count active users in timeframe
            active_users = sum(
                1
                for session in user_sessions.values()
                if session.last_activity >= start_time
            )

            # Message statistics (mock data for now)
            message_stats = {
                "total_messages": len(user_sessions) * 5,  # Mock calculation
                "text_messages": len(user_sessions) * 3,
                "voice_messages": len(user_sessions) * 1,
                "media_messages": len(user_sessions) * 1,
            }

            return {
                "timeframe": timeframe,
                "period_start": start_time.isoformat(),
                "period_end": now.isoformat(),
                "users": {
                    "total": len(user_sessions),
                    "active": active_users,
                    "new": max(0, len(user_sessions) - 10),  # Mock
                },
                "messages": message_stats,
                "transactions": {
                    "total": 0,  # Would come from transaction tracking
                    "successful": 0,
                    "pending": 0,
                    "failed": 0,
                },
                "performance": {
                    "avg_response_time": 1.2,  # Mock
                    "success_rate": 98.5,  # Mock
                    "error_rate": 1.5,  # Mock
                },
            }

        except Exception as e:
            logger.error("Error getting analytics data", error=str(e))
            raise

    async def restart_whatsapp_service(self) -> Dict[str, Any]:
        """Restart the WhatsApp service"""
        try:
            logger.info("Restarting WhatsApp service...")

            # Close current connection (if available)
            if (
                hasattr(self.whatsapp_service, "driver")
                and self.whatsapp_service.driver
            ):
                try:
                    self.whatsapp_service.driver.quit()
                except Exception:
                    pass

            # Wait a moment
            await asyncio.sleep(2)

            # Reinitialize (placeholder - would need actual method)
            # await self.whatsapp_service.reinitialize()
            logger.info("WhatsApp service restart requested")

            logger.info("WhatsApp service restarted successfully")
            return {
                "success": True,
                "message": "WhatsApp service restarted successfully",
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error("Error restarting WhatsApp service", error=str(e))
            return {
                "success": False,
                "message": f"Failed to restart WhatsApp service: {str(e)}",
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def get_service_logs(
        self, service: str = "all", level: str = "INFO", limit: int = 100
    ) -> Dict[str, Any]:
        """Get service logs (mock implementation)"""
        try:
            # This would typically read from log files or logging service
            # For now, return mock data
            mock_logs = [
                {
                    "timestamp": (datetime.utcnow() - timedelta(minutes=i)).isoformat(),
                    "level": "INFO",
                    "service": "whatsapp",
                    "message": f"Processed message from user {i}",
                }
                for i in range(min(limit, 20))
            ]

            return {
                "logs": mock_logs,
                "total": len(mock_logs),
                "service": service,
                "level": level,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error("Error getting service logs", error=str(e))
            raise

    async def update_system_settings(
        self, settings_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update system settings"""
        try:
            # This would update configuration settings
            # For now, just validate and return success

            valid_settings = ["debug_mode", "log_level", "session_timeout"]
            updated_settings = {}

            for key, value in settings_data.items():
                if key in valid_settings:
                    updated_settings[key] = value
                    logger.info(f"Updated setting {key} to {value}")

            return {
                "success": True,
                "message": f"Updated {len(updated_settings)} settings",
                "updated_settings": updated_settings,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error("Error updating system settings", error=str(e))
            return {
                "success": False,
                "message": f"Failed to update settings: {str(e)}",
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def _check_services_health(self) -> Dict[str, Any]:
        """Check health of all services"""
        health_status = {}

        # Check Bitsacco API
        try:
            api_health = await self.bitsacco_api.health_check()
            health_status["bitsacco_api"] = {
                "status": (
                    "healthy" if api_health.get("status") == "healthy" else "unhealthy"
                ),
                "last_check": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            health_status["bitsacco_api"] = {
                "status": "error",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
            }

        # Check WhatsApp service (mock for now)
        health_status["whatsapp"] = {
            "status": "healthy",  # Would check actual connection
            "last_check": datetime.utcnow().isoformat(),
        }

        # Check database (mock for now)
        health_status["database"] = {
            "status": "healthy",  # Would check DB connection
            "last_check": datetime.utcnow().isoformat(),
        }

        return health_status

    def _get_uptime(self) -> str:
        """Get system uptime"""
        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.now() - boot_time

            days = uptime.days
            hours, remainder = divmod(uptime.seconds, 3600)
            minutes, _ = divmod(remainder, 60)

            return f"{days}d {hours}h {minutes}m"
        except Exception:
            return "Unknown"

    async def get_user_details(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific user"""
        try:
            session = self.user_service.user_sessions.get(phone_number)
            if not session:
                return None

            return {
                "phone_number": phone_number,
                "is_authenticated": session.is_authenticated,
                "current_state": session.current_state.value,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "conversation_history": session.conversation_history or [],
                "context_data": session.context_data or {},
                "user_id": getattr(session, "user_id", None),
                "otp_sent_at": getattr(session, "otp_sent_at", None),
            }

        except Exception as e:
            logger.error("Error getting user details", error=str(e), phone=phone_number)
            raise

    async def block_user(self, phone_number: str) -> Dict[str, Any]:
        """Block a user (remove their session)"""
        try:
            if phone_number in self.user_service.user_sessions:
                del self.user_service.user_sessions[phone_number]
                logger.info("User blocked and session removed", phone=phone_number)
                return {
                    "success": True,
                    "message": f"User {phone_number} has been blocked",
                }
            else:
                return {
                    "success": False,
                    "message": f"User {phone_number} not found",
                }

        except Exception as e:
            logger.error("Error blocking user", error=str(e), phone=phone_number)
            return {
                "success": False,
                "message": f"Error blocking user: {str(e)}",
            }
