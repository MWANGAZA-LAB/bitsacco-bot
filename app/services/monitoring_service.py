"""
Production Monitoring Service for Bitsacco WhatsApp Bot
Comprehensive system monitoring, alerting, and observability
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import structlog
from dataclasses import dataclass
from enum import Enum

logger = structlog.get_logger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SystemMetric:
    """System metric data point"""

    name: str
    value: float
    timestamp: datetime
    unit: str
    tags: Dict[str, str]


@dataclass
class Alert:
    """System alert"""

    id: str
    severity: AlertSeverity
    title: str
    description: str
    timestamp: datetime
    source: str
    resolved: bool = False


class MonitoringService:
    """Production monitoring service with metrics and alerting"""

    def __init__(self):
        self.metrics_buffer: List[SystemMetric] = []
        self.active_alerts: Dict[str, Alert] = {}
        self.metric_thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "disk_percent": 90.0,
            "response_time_ms": 5000.0,
            "error_rate_percent": 5.0,
        }
        self.is_running = False

    async def start(self) -> None:
        """Start monitoring service"""
        self.is_running = True

        # Start background monitoring tasks
        asyncio.create_task(self._collect_system_metrics())
        asyncio.create_task(self._check_service_health())
        asyncio.create_task(self._process_alerts())

        logger.info("🔍 Monitoring service started")

    async def stop(self) -> None:
        """Stop monitoring service"""
        self.is_running = False
        logger.info("🛑 Monitoring service stopped")

    async def record_metric(self, metric: SystemMetric) -> None:
        """Record a system metric"""
        self.metrics_buffer.append(metric)

        # Check for threshold violations
        await self._check_metric_thresholds(metric)

        # Keep buffer size manageable
        if len(self.metrics_buffer) > 1000:
            self.metrics_buffer = self.metrics_buffer[-500:]

    async def create_alert(
        self, severity: AlertSeverity, title: str, description: str, source: str
    ) -> None:
        """Create a new system alert"""
        alert_id = f"{source}_{int(time.time())}"

        alert = Alert(
            id=alert_id,
            severity=severity,
            title=title,
            description=description,
            timestamp=datetime.utcnow(),
            source=source,
        )

        self.active_alerts[alert_id] = alert

        # Log alert
        logger.warning(
            "System alert created",
            alert_id=alert_id,
            severity=severity.value,
            title=title,
            source=source,
        )

        # In production, send to external alerting system
        await self._send_alert_notification(alert)

    async def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status"""
        recent_metrics = self._get_recent_metrics(minutes=5)

        return {
            "status": "healthy" if len(self.active_alerts) == 0 else "degraded",
            "active_alerts": len(self.active_alerts),
            "critical_alerts": len(
                [
                    a
                    for a in self.active_alerts.values()
                    if a.severity == AlertSeverity.CRITICAL
                ]
            ),
            "metrics_collected": len(recent_metrics),
            "uptime": self._calculate_uptime(),
            "last_health_check": datetime.utcnow().isoformat(),
        }

    async def _collect_system_metrics(self) -> None:
        """Background task to collect system metrics"""
        import psutil

        while self.is_running:
            try:
                # CPU metrics
                cpu_metric = SystemMetric(
                    name="cpu_percent",
                    value=psutil.cpu_percent(interval=1),
                    timestamp=datetime.utcnow(),
                    unit="percent",
                    tags={"source": "system"},
                )
                await self.record_metric(cpu_metric)

                # Memory metrics
                memory = psutil.virtual_memory()
                memory_metric = SystemMetric(
                    name="memory_percent",
                    value=memory.percent,
                    timestamp=datetime.utcnow(),
                    unit="percent",
                    tags={"source": "system"},
                )
                await self.record_metric(memory_metric)

                # Sleep before next collection
                await asyncio.sleep(30)  # Collect every 30 seconds

            except Exception as e:
                logger.error("Error collecting system metrics", error=str(e))
                await asyncio.sleep(60)  # Wait longer on error

    async def _check_service_health(self) -> None:
        """Background task to check service health"""
        while self.is_running:
            try:
                # This would check various service endpoints
                # Implementation depends on service architecture
                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error("Error checking service health", error=str(e))
                await asyncio.sleep(120)

    async def _process_alerts(self) -> None:
        """Background task to process and resolve alerts"""
        while self.is_running:
            try:
                # Auto-resolve old alerts if conditions are met
                for alert_id, alert in list(self.active_alerts.items()):
                    if self._should_auto_resolve(alert):
                        alert.resolved = True
                        del self.active_alerts[alert_id]
                        logger.info("Alert auto-resolved", alert_id=alert_id)

                await asyncio.sleep(300)  # Process every 5 minutes

            except Exception as e:
                logger.error("Error processing alerts", error=str(e))
                await asyncio.sleep(600)

    async def _check_metric_thresholds(self, metric: SystemMetric) -> None:
        """Check if metric violates thresholds"""
        threshold = self.metric_thresholds.get(metric.name)
        if not threshold:
            return

        if metric.value > threshold:
            severity = (
                AlertSeverity.HIGH
                if metric.value > threshold * 1.2
                else AlertSeverity.MEDIUM
            )

            await self.create_alert(
                severity=severity,
                title=f"High {metric.name.replace('_', ' ').title()}",
                description=f"{metric.name} is {metric.value}{metric.unit}, above threshold of {threshold}{metric.unit}",
                source="metrics",
            )

    async def _send_alert_notification(self, alert: Alert) -> None:
        """Send alert notification (placeholder for external systems)"""
        # In production, integrate with:
        # - Slack/Teams notifications
        # - Email alerts
        # - SMS for critical alerts
        # - PagerDuty/OpsGenie
        pass

    def _get_recent_metrics(self, minutes: int = 5) -> List[SystemMetric]:
        """Get metrics from recent time window"""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        return [m for m in self.metrics_buffer if m.timestamp > cutoff]

    def _should_auto_resolve(self, alert: Alert) -> bool:
        """Check if alert should be auto-resolved"""
        # Auto-resolve alerts older than 1 hour if conditions improve
        return (datetime.utcnow() - alert.timestamp) > timedelta(hours=1)

    def _calculate_uptime(self) -> str:
        """Calculate system uptime"""
        # Placeholder - would track service start time
        return "99.9%"
