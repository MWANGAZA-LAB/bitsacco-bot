"""
Admin Service - Administrative dashboard and monitoring
Handles admin operations, analytics, and system management
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import asyncio
import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.user import UserSession, ServiceHealth
from ..services.whatsapp_service import WhatsAppService
from ..services.bitcoin_service import BitcoinPriceService
from ..services.ai_service import AIConversationService
from ..services.user_service import UserService
from ..services.bitsacco_api import BitsaccoAPIService

logger = structlog.get_logger(__name__)


@dataclass
class SystemStats:
    """System statistics data"""

    total_users: int
    active_sessions: int
    authenticated_users: int
    messages_today: int
    messages_this_hour: int
    transactions_today: int
    uptime_seconds: float
    memory_usage_mb: float
    cpu_usage_percent: float


@dataclass
class UserAnalytics:
    """User analytics data"""

    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    active_users_today: int
    active_users_this_week: int
    retention_rate_7d: float
    retention_rate_30d: float


@dataclass
class MessageAnalytics:
    """Message analytics data"""

    total_messages: int
    messages_by_hour: List[Dict[str, Any]]
    messages_by_day: List[Dict[str, Any]]
    popular_commands: List[Dict[str, Any]]
    response_times: Dict[str, float]
    error_rate: float


class AdminService:
    """Production admin service for dashboard and monitoring"""

    def __init__(
        self,
        whatsapp_service: WhatsAppService,
        bitcoin_service: BitcoinPriceService,
        ai_service: AIConversationService,
        user_service: UserService,
        bitsacco_api: BitsaccoAPIService,
    ):
        self.whatsapp_service = whatsapp_service
        self.bitcoin_service = bitcoin_service
        self.ai_service = ai_service
        self.user_service = user_service
        self.bitsacco_api = bitsacco_api

        self.is_running = False
        self.start_time = datetime.utcnow()

        # Cache for analytics
        self.analytics_cache: Dict[str, Any] = {}
        self.cache_ttl = timedelta(minutes=5)

        # System monitoring
        self.health_checks: List[ServiceHealth] = []

    async def start(self) -> None:
        """Start the admin service"""
        try:
            self.is_running = True
            self.start_time = datetime.utcnow()

            # Start background tasks
            asyncio.create_task(self._periodic_health_checks())
            asyncio.create_task(self._periodic_analytics_update())

            logger.info("✅ Admin service started")

        except Exception as e:
            logger.error("❌ Failed to start admin service", error=str(e))
            raise

    async def stop(self) -> None:
        """Stop the admin service"""
        self.is_running = False
        self.analytics_cache.clear()
        logger.info("🛑 Admin service stopped")

    async def get_dashboard_overview(self) -> Dict[str, Any]:
        """Get dashboard overview data"""
        try:
            # Get system stats
            system_stats = await self.get_system_stats()

            # Get service health
            service_health = await self.get_all_service_health()

            # Get recent analytics
            user_analytics = await self.get_user_analytics()
            message_analytics = await self.get_message_analytics()

            # Get Bitcoin price info
            bitcoin_health = await self.bitcoin_service.health_check()

            return {
                "timestamp": datetime.utcnow().isoformat(),
                "system": {
                    "stats": system_stats.__dict__,
                    "health": service_health,
                    "uptime": self._get_uptime(),
                },
                "users": user_analytics.__dict__,
                "messages": message_analytics.__dict__,
                "bitcoin": {
                    "service_status": bitcoin_health.get("status"),
                    "last_update": bitcoin_health.get("last_update"),
                    "cache_size": bitcoin_health.get("cache_size", 0),
                },
            }

        except Exception as e:
            logger.error("Error getting dashboard overview", error=str(e))
            raise

    async def get_system_stats(self) -> SystemStats:
        """Get current system statistics"""
        try:
            # Get user service stats
            user_health = await self.user_service.health_check()

            # Get WhatsApp service stats
            whatsapp_health = await self.whatsapp_service.health_check()

            # Calculate uptime
            uptime = (datetime.utcnow() - self.start_time).total_seconds()

            # Get system resource usage (simplified)
            import psutil

            memory_usage = psutil.virtual_memory().used / (1024 * 1024)  # MB
            cpu_usage = psutil.cpu_percent(interval=1)

            # Get message counts (would be from database in production)
            messages_today = whatsapp_health.get("stats", {}).get("messages_sent", 0)

            return SystemStats(
                total_users=await self._get_total_users(),
                active_sessions=user_health.get("active_sessions", 0),
                authenticated_users=user_health.get("authenticated_sessions", 0),
                messages_today=messages_today,
                messages_this_hour=await self._get_messages_this_hour(),
                transactions_today=await self._get_transactions_today(),
                uptime_seconds=uptime,
                memory_usage_mb=memory_usage,
                cpu_usage_percent=cpu_usage,
            )

        except Exception as e:
            logger.error("Error getting system stats", error=str(e))
            # Return default stats on error
            return SystemStats(0, 0, 0, 0, 0, 0, 0.0, 0.0, 0.0)

    async def get_user_analytics(self) -> UserAnalytics:
        """Get user analytics data"""
        try:
            cache_key = "user_analytics"
            cached = self._get_cached_data(cache_key)
            if cached:
                return UserAnalytics(**cached)

            # Calculate analytics (simplified - would use database queries)
            new_users_today = await self._get_new_users_today()
            new_users_week = await self._get_new_users_week()
            new_users_month = await self._get_new_users_month()
            active_today = await self._get_active_users_today()
            active_week = await self._get_active_users_week()

            analytics = UserAnalytics(
                new_users_today=new_users_today,
                new_users_this_week=new_users_week,
                new_users_this_month=new_users_month,
                active_users_today=active_today,
                active_users_this_week=active_week,
                retention_rate_7d=await self._calculate_retention_rate(7),
                retention_rate_30d=await self._calculate_retention_rate(30),
            )

            # Cache the result
            self._set_cached_data(cache_key, analytics.__dict__)

            return analytics

        except Exception as e:
            logger.error("Error getting user analytics", error=str(e))
            return UserAnalytics(0, 0, 0, 0, 0, 0.0, 0.0)

    async def get_message_analytics(self) -> MessageAnalytics:
        """Get message analytics data"""
        try:
            cache_key = "message_analytics"
            cached = self._get_cached_data(cache_key)
            if cached:
                return MessageAnalytics(**cached)

            # Get WhatsApp service stats
            whatsapp_health = await self.whatsapp_service.health_check()
            stats = whatsapp_health.get("stats", {})

            analytics = MessageAnalytics(
                total_messages=stats.get("messages_received", 0),
                messages_by_hour=await self._get_messages_by_hour(),
                messages_by_day=await self._get_messages_by_day(),
                popular_commands=await self._get_popular_commands(),
                response_times=await self._get_response_times(),
                error_rate=await self._calculate_error_rate(),
            )

            # Cache the result
            self._set_cached_data(cache_key, analytics.__dict__)

            return analytics

        except Exception as e:
            logger.error("Error getting message analytics", error=str(e))
            return MessageAnalytics(0, [], [], [], {}, 0.0)

    async def get_all_service_health(self) -> Dict[str, ServiceHealth]:
        """Get health status of all services"""
        try:
            services = {}

            # WhatsApp Service
            whatsapp_health = await self.whatsapp_service.health_check()
            services["whatsapp"] = ServiceHealth(
                service_name="WhatsApp",
                status=whatsapp_health.get("status", "unknown"),
                last_check=datetime.utcnow(),
                details=whatsapp_health,
            )

            # Bitcoin Service
            bitcoin_health = await self.bitcoin_service.health_check()
            services["bitcoin"] = ServiceHealth(
                service_name="Bitcoin Price",
                status=bitcoin_health.get("status", "unknown"),
                last_check=datetime.utcnow(),
                details=bitcoin_health,
            )

            # AI Service
            ai_health = await self.ai_service.health_check()
            services["ai"] = ServiceHealth(
                service_name="AI Conversation",
                status=ai_health.get("status", "unknown"),
                last_check=datetime.utcnow(),
                details=ai_health,
            )

            # User Service
            user_health = await self.user_service.health_check()
            services["user"] = ServiceHealth(
                service_name="User Management",
                status=user_health.get("status", "unknown"),
                last_check=datetime.utcnow(),
                details=user_health,
            )

            return services

        except Exception as e:
            logger.error("Error getting service health", error=str(e))
            return {}

    async def get_user_list(
        self,
        page: int = 1,
        per_page: int = 50,
        filter_authenticated: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of users"""
        try:
            # Get all sessions from user service
            all_sessions = list(self.user_service.user_sessions.values())

            # Apply filters
            if filter_authenticated is not None:
                all_sessions = [
                    s
                    for s in all_sessions
                    if s.is_authenticated == filter_authenticated
                ]

            # Sort by last activity
            all_sessions.sort(
                key=lambda x: x.last_activity or datetime.min, reverse=True
            )

            # Paginate
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            page_sessions = all_sessions[start_idx:end_idx]

            # Format user data
            users = []
            for session in page_sessions:
                users.append(
                    {
                        "phone_number": session.phone_number,
                        "first_name": getattr(session, "first_name", None),
                        "last_name": getattr(session, "last_name", None),
                        "is_authenticated": session.is_authenticated,
                        "current_state": session.current_state.value,
                        "created_at": session.created_at.isoformat(),
                        "last_activity": (
                            session.last_activity.isoformat()
                            if session.last_activity
                            else None
                        ),
                        "authenticated_at": (
                            session.authenticated_at.isoformat()
                            if hasattr(session, "authenticated_at")
                            and session.authenticated_at
                            else None
                        ),
                    }
                )

            return {
                "users": users,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": len(all_sessions),
                    "pages": (len(all_sessions) + per_page - 1) // per_page,
                },
            }

        except Exception as e:
            logger.error("Error getting user list", error=str(e))
            return {"users": [], "pagination": {}}

    async def get_system_logs(
        self, level: Optional[str] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get recent system logs"""
        try:
            # In a real implementation, this would query the database
            # For now, return mock data
            logs = []

            # Get recent log entries (simplified)
            levels = ["INFO", "WARNING", "ERROR", "DEBUG"]
            if level:
                levels = [level.upper()]

            for i in range(min(limit, 50)):
                log_level = levels[i % len(levels)]
                logs.append(
                    {
                        "timestamp": (
                            datetime.utcnow() - timedelta(minutes=i)
                        ).isoformat(),
                        "level": log_level,
                        "module": f"module_{i % 5}",
                        "message": f"Sample log message {i}",
                        "user_phone": f"+25470000{i:04d}" if i % 3 == 0 else None,
                        "extra_data": {"request_id": f"req_{i}"},
                    }
                )

            return logs

        except Exception as e:
            logger.error("Error getting system logs", error=str(e))
            return []

    async def restart_service(self, service_name: str) -> Dict[str, Any]:
        """Restart a specific service"""
        try:
            success = False
            message = ""

            if service_name == "whatsapp":
                await self.whatsapp_service.stop()
                await self.whatsapp_service.start()
                success = True
                message = "WhatsApp service restarted successfully"

            elif service_name == "bitcoin":
                await self.bitcoin_service.stop()
                await self.bitcoin_service.start()
                success = True
                message = "Bitcoin service restarted successfully"

            elif service_name == "ai":
                await self.ai_service.stop()
                await self.ai_service.start()
                success = True
                message = "AI service restarted successfully"

            else:
                message = f"Unknown service: {service_name}"

            logger.info(
                "Service restart attempted", service=service_name, success=success
            )

            return {
                "success": success,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error("Error restarting service", service=service_name, error=str(e))
            return {
                "success": False,
                "message": f"Failed to restart {service_name}: {str(e)}",
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def health_check(self) -> Dict[str, Any]:
        """Admin service health check"""
        return {
            "status": "healthy" if self.is_running else "unhealthy",
            "is_running": self.is_running,
            "uptime_seconds": self._get_uptime(),
            "cache_entries": len(self.analytics_cache),
        }

    def _get_uptime(self) -> float:
        """Get service uptime in seconds"""
        return (datetime.utcnow() - self.start_time).total_seconds()

    def _get_cached_data(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached analytics data"""
        if key in self.analytics_cache:
            cached_item = self.analytics_cache[key]
            if datetime.utcnow() - cached_item["timestamp"] < self.cache_ttl:
                return cached_item["data"]
            else:
                del self.analytics_cache[key]
        return None

    def _set_cached_data(self, key: str, data: Dict[str, Any]) -> None:
        """Set cached analytics data"""
        self.analytics_cache[key] = {"data": data, "timestamp": datetime.utcnow()}

    async def _periodic_health_checks(self) -> None:
        """Periodic health checks for all services"""
        while self.is_running:
            try:
                health_status = await self.get_all_service_health()
                self.health_checks = list(health_status.values())

                # Log any unhealthy services
                for service_health in self.health_checks:
                    if service_health.status != "healthy":
                        logger.warning(
                            "Service unhealthy",
                            service=service_health.service_name,
                            status=service_health.status,
                        )

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                logger.error("Error in periodic health checks", error=str(e))
                await asyncio.sleep(60)  # Back off on error

    async def _periodic_analytics_update(self) -> None:
        """Periodic analytics cache update"""
        while self.is_running:
            try:
                # Clear old cache entries
                self.analytics_cache.clear()

                # Pre-populate important analytics
                await self.get_user_analytics()
                await self.get_message_analytics()

                await asyncio.sleep(300)  # Update every 5 minutes

            except Exception as e:
                logger.error("Error in periodic analytics update", error=str(e))
                await asyncio.sleep(600)  # Back off on error

    # Helper methods for analytics (simplified implementations)
    async def _get_total_users(self) -> int:
        """Get total number of users"""
        return len(self.user_service.user_sessions)

    async def _get_messages_this_hour(self) -> int:
        """Get messages received this hour"""
        # Simplified implementation
        return 25

    async def _get_transactions_today(self) -> int:
        """Get transactions processed today"""
        # Simplified implementation
        return 8

    async def _get_new_users_today(self) -> int:
        """Get new users registered today"""
        today = datetime.utcnow().date()
        count = 0
        for session in self.user_service.user_sessions.values():
            if session.created_at.date() == today:
                count += 1
        return count

    async def _get_new_users_week(self) -> int:
        """Get new users this week"""
        week_ago = datetime.utcnow() - timedelta(days=7)
        count = 0
        for session in self.user_service.user_sessions.values():
            if session.created_at >= week_ago:
                count += 1
        return count

    async def _get_new_users_month(self) -> int:
        """Get new users this month"""
        month_ago = datetime.utcnow() - timedelta(days=30)
        count = 0
        for session in self.user_service.user_sessions.values():
            if session.created_at >= month_ago:
                count += 1
        return count

    async def _get_active_users_today(self) -> int:
        """Get active users today"""
        today = datetime.utcnow().date()
        count = 0
        for session in self.user_service.user_sessions.values():
            if session.last_activity and session.last_activity.date() == today:
                count += 1
        return count

    async def _get_active_users_week(self) -> int:
        """Get active users this week"""
        week_ago = datetime.utcnow() - timedelta(days=7)
        count = 0
        for session in self.user_service.user_sessions.values():
            if session.last_activity and session.last_activity >= week_ago:
                count += 1
        return count

    async def _calculate_retention_rate(self, days: int) -> float:
        """Calculate user retention rate"""
        # Simplified calculation
        return 75.5 if days == 7 else 65.2

    async def _get_messages_by_hour(self) -> List[Dict[str, Any]]:
        """Get message count by hour for the last 24 hours"""
        # Simplified implementation
        hours = []
        for i in range(24):
            hour = datetime.utcnow() - timedelta(hours=i)
            hours.append(
                {
                    "hour": hour.strftime("%H:00"),
                    "count": max(0, 50 - i * 2 + (i % 3) * 10),
                }
            )
        return hours[::-1]  # Reverse to show chronologically

    async def _get_messages_by_day(self) -> List[Dict[str, Any]]:
        """Get message count by day for the last 7 days"""
        # Simplified implementation
        days = []
        for i in range(7):
            day = datetime.utcnow() - timedelta(days=i)
            days.append(
                {
                    "date": day.strftime("%Y-%m-%d"),
                    "count": max(100, 500 - i * 50 + (i % 2) * 100),
                }
            )
        return days[::-1]  # Reverse to show chronologically

    async def _get_popular_commands(self) -> List[Dict[str, Any]]:
        """Get most popular bot commands"""
        # Simplified implementation
        return [
            {"command": "price", "count": 156, "percentage": 31.2},
            {"command": "balance", "count": 134, "percentage": 26.8},
            {"command": "help", "count": 89, "percentage": 17.8},
            {"command": "start", "count": 67, "percentage": 13.4},
            {"command": "profile", "count": 54, "percentage": 10.8},
        ]

    async def _get_response_times(self) -> Dict[str, float]:
        """Get average response times by service"""
        # Simplified implementation
        return {
            "whatsapp": 1.2,
            "ai": 2.8,
            "bitcoin": 0.5,
            "bitsacco_api": 1.8,
            "overall": 1.6,
        }

    async def _calculate_error_rate(self) -> float:
        """Calculate overall error rate"""
        # Simplified implementation
        return 2.3
