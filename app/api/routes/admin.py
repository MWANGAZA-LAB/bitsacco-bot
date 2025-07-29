"""
Admin API Routes - Dashboard and administrative endpoints
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

from ...services.admin_service import AdminService
from ...config import settings

logger = structlog.get_logger(__name__)

# Security for admin endpoints
security = HTTPBearer()

# Create router
router = APIRouter(prefix="/admin", tags=["admin"])


async def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> bool:
    """Verify admin authentication token"""
    # In production, implement proper JWT validation
    # For now, simple token check
    if credentials.credentials != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin credentials")
    return True


@router.get("/dashboard")
async def get_dashboard_overview(
    admin_service: AdminService = Depends(), _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get comprehensive dashboard overview"""
    try:
        overview = await admin_service.get_dashboard_overview()
        return {"success": True, "data": overview}
    except Exception as e:
        logger.error("Dashboard overview error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")


@router.get("/stats/system")
async def get_system_stats(
    admin_service: AdminService = Depends(), _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get detailed system statistics"""
    try:
        stats = await admin_service.get_system_stats()
        return {"success": True, "data": stats.__dict__}
    except Exception as e:
        logger.error("System stats error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch system stats")


@router.get("/stats/users")
async def get_user_analytics(
    admin_service: AdminService = Depends(), _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get user analytics and statistics"""
    try:
        analytics = await admin_service.get_user_analytics()
        return {"success": True, "data": analytics.__dict__}
    except Exception as e:
        logger.error("User analytics error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch user analytics")


@router.get("/stats/messages")
async def get_message_analytics(
    admin_service: AdminService = Depends(), _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get message analytics and statistics"""
    try:
        analytics = await admin_service.get_message_analytics()
        return {"success": True, "data": analytics.__dict__}
    except Exception as e:
        logger.error("Message analytics error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch message analytics")


@router.get("/health")
async def get_all_service_health(
    admin_service: AdminService = Depends(), _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get health status of all services"""
    try:
        health_status = await admin_service.get_all_service_health()

        # Convert ServiceHealth objects to dicts
        health_data = {}
        for service_name, health in health_status.items():
            health_data[service_name] = {
                "service_name": health.service_name,
                "status": health.status,
                "last_check": health.last_check.isoformat(),
                "response_time_ms": health.response_time_ms,
                "error_message": health.error_message,
                "details": health.details,
            }

        return {"success": True, "data": health_data}
    except Exception as e:
        logger.error("Service health error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch service health")


@router.get("/users")
async def get_user_list(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    authenticated: Optional[bool] = Query(None),
    admin_service: AdminService = Depends(),
    _: bool = Depends(verify_admin_token),
) -> Dict[str, Any]:
    """Get paginated list of users"""
    try:
        users_data = await admin_service.get_user_list(
            page=page, per_page=per_page, filter_authenticated=authenticated
        )
        return {"success": True, "data": users_data}
    except Exception as e:
        logger.error("User list error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch user list")


@router.get("/users/{phone_number}")
async def get_user_details(
    phone_number: str,
    admin_service: AdminService = Depends(),
    _: bool = Depends(verify_admin_token),
) -> Dict[str, Any]:
    """Get detailed information about a specific user"""
    try:
        # Get user session
        user_sessions = admin_service.user_service.user_sessions

        if phone_number not in user_sessions:
            raise HTTPException(status_code=404, detail="User not found")

        session = user_sessions[phone_number]

        user_data = {
            "phone_number": session.phone_number,
            "first_name": getattr(session, "first_name", None),
            "last_name": getattr(session, "last_name", None),
            "is_authenticated": session.is_authenticated,
            "current_state": session.current_state.value,
            "created_at": session.created_at.isoformat(),
            "last_activity": (
                session.last_activity.isoformat() if session.last_activity else None
            ),
            "authenticated_at": (
                session.authenticated_at.isoformat()
                if hasattr(session, "authenticated_at") and session.authenticated_at
                else None
            ),
            "conversation_history": getattr(session, "conversation_history", [])[
                -10:
            ],  # Last 10 messages
        }

        return {"success": True, "data": user_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("User details error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch user details")


@router.get("/logs")
async def get_system_logs(
    level: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    admin_service: AdminService = Depends(),
    _: bool = Depends(verify_admin_token),
) -> Dict[str, Any]:
    """Get recent system logs"""
    try:
        logs = await admin_service.get_system_logs(level=level, limit=limit)
        return {
            "success": True,
            "data": {
                "logs": logs,
                "total": len(logs),
                "filters": {"level": level, "limit": limit},
            },
        }
    except Exception as e:
        logger.error("System logs error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch system logs")


@router.post("/services/{service_name}/restart")
async def restart_service(
    service_name: str,
    admin_service: AdminService = Depends(),
    _: bool = Depends(verify_admin_token),
) -> Dict[str, Any]:
    """Restart a specific service"""
    try:
        result = await admin_service.restart_service(service_name)

        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "timestamp": result["timestamp"],
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Service restart error", service=service_name, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to restart {service_name}")


@router.get("/metrics/live")
async def get_live_metrics(
    admin_service: AdminService = Depends(), _: bool = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get real-time metrics for live dashboard updates"""
    try:
        # Get essential metrics for real-time updates
        system_stats = await admin_service.get_system_stats()
        service_health = await admin_service.get_all_service_health()

        # Count healthy vs unhealthy services
        healthy_services = sum(
            1 for health in service_health.values() if health.status == "healthy"
        )
        total_services = len(service_health)

        metrics = {
            "timestamp": system_stats.__dict__.get("uptime_seconds", 0),
            "active_sessions": system_stats.active_sessions,
            "authenticated_users": system_stats.authenticated_users,
            "messages_today": system_stats.messages_today,
            "memory_usage_mb": system_stats.memory_usage_mb,
            "cpu_usage_percent": system_stats.cpu_usage_percent,
            "healthy_services": healthy_services,
            "total_services": total_services,
            "service_health_percentage": (
                (healthy_services / total_services * 100) if total_services > 0 else 0
            ),
        }

        return {"success": True, "data": metrics}
    except Exception as e:
        logger.error("Live metrics error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch live metrics")


@router.get("/search/users")
async def search_users(
    q: str = Query(..., min_length=3),
    admin_service: AdminService = Depends(),
    _: bool = Depends(verify_admin_token),
) -> Dict[str, Any]:
    """Search users by phone number or name"""
    try:
        # Get all user sessions
        all_sessions = list(admin_service.user_service.user_sessions.values())

        # Search in phone numbers and names
        matching_users = []
        search_term = q.lower()

        for session in all_sessions:
            # Search in phone number
            if search_term in session.phone_number.lower():
                matching_users.append(session)
                continue

            # Search in names
            first_name = getattr(session, "first_name", "") or ""
            last_name = getattr(session, "last_name", "") or ""
            full_name = f"{first_name} {last_name}".lower()

            if search_term in full_name:
                matching_users.append(session)

        # Format results
        results = []
        for session in matching_users[:20]:  # Limit to 20 results
            results.append(
                {
                    "phone_number": session.phone_number,
                    "first_name": getattr(session, "first_name", None),
                    "last_name": getattr(session, "last_name", None),
                    "is_authenticated": session.is_authenticated,
                    "last_activity": (
                        session.last_activity.isoformat()
                        if session.last_activity
                        else None
                    ),
                }
            )

        return {
            "success": True,
            "data": {"results": results, "total": len(results), "query": q},
        }
    except Exception as e:
        logger.error("User search error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to search users")
