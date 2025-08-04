"""
Production Database and Caching Service
Optimized database operations with Redis caching layer
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, TYPE_CHECKING
import structlog

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func

from ..database.models import (
    UserSessionModel,
    TransactionModel,
    BitcoinPriceModel,
)

# Handle optional Redis support
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    if TYPE_CHECKING:
        import redis.asyncio as aioredis  # type: ignore
    REDIS_AVAILABLE = False

logger = structlog.get_logger(__name__)


class CacheService:
    """Production Redis caching service"""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.redis: Optional[Any] = None  # Will be aioredis.Redis if available
        self.default_ttl = 3600  # Default time-to-live: 1 hour

    async def start(self) -> None:
        """Initialize Redis connection"""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, caching disabled")
            return

        try:
            self.redis = await aioredis.from_url(
                self.redis_url, encoding="utf-8", decode_responses=True
            )
            await self.redis.ping()
            logger.info("✅ Redis cache service started")
        except Exception as e:
            logger.error("Failed to start Redis cache", error=str(e))
            self.redis = None

    async def stop(self) -> None:
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("🛑 Redis cache service stopped")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis:
            return None

        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error("Cache get error", key=key, error=str(e))

        return None

    async def set(
        self, key: str, value: Any, ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache"""
        if not self.redis:
            return False

        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value, default=str)
            await self.redis.set(key, serialized, ex=ttl)
            return True
        except Exception as e:
            logger.error("Cache set error", key=key, error=str(e))

        return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis:
            return False

        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error("Cache delete error", key=key, error=str(e))

        return False

    async def health_check(self) -> Dict[str, Any]:
        """Check Redis cache health"""
        if not self.redis:
            return {"status": "disabled", "redis_available": False}

        try:
            latency = await self.redis.ping()
            info = await self.redis.info()

            return {
                "status": "healthy",
                "redis_available": True,
                "latency_ms": latency,
                "memory_used": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "redis_available": False,
            }


class DatabaseService:
    """Production database service with Redis caching"""

    def __init__(self, cache_service: CacheService):
        self.cache = cache_service

    async def get_user_session_cached(
        self, session: AsyncSession, phone_number: str
    ) -> Optional[UserSessionModel]:
        """Get user session with caching"""
        cache_key = f"user_session:{phone_number}"
        cached_data = await self.cache.get(cache_key)

        if cached_data:
            logger.debug("User session cache hit", phone=phone_number)
            return UserSessionModel(**cached_data)

        result = await session.execute(
            select(UserSessionModel).where(
                UserSessionModel.phone_number == phone_number
            )
        )
        user_session = result.scalar_one_or_none()

        if user_session:
            cache_data = {
                "phone_number": user_session.phone_number,
                "is_authenticated": user_session.is_authenticated,
                "current_state": user_session.current_state.value,
                "created_at": user_session.created_at.isoformat(),
                "last_activity": user_session.last_activity.isoformat(),
            }
            await self.cache.set(cache_key, cache_data, ttl=1800)
            logger.debug("User session cached", phone=phone_number)

        return user_session

    async def get_bitcoin_price_cached(
        self, session: AsyncSession
    ) -> Optional[BitcoinPriceModel]:
        """Get latest Bitcoin price with caching"""
        cache_key = "bitcoin_price:latest"
        cached_price = await self.cache.get(cache_key)

        if cached_price:
            logger.debug("Bitcoin price cache hit")
            return BitcoinPriceModel(**cached_price)

        result = await session.execute(
            select(BitcoinPriceModel)
            .order_by(BitcoinPriceModel.timestamp.desc())
            .limit(1)
        )
        price_model = result.scalar_one_or_none()

        if price_model:
            cache_data = {
                "price_usd": price_model.price_usd,
                "price_kes": price_model.price_kes,
                "change_24h_usd": price_model.change_24h_usd,
                "change_24h_kes": price_model.change_24h_kes,
                "timestamp": price_model.timestamp.isoformat(),
                "source": price_model.source,
            }
            await self.cache.set(cache_key, cache_data, ttl=300)
            logger.debug("Bitcoin price cached")

        return price_model

    async def get_user_transaction_history_cached(
        self, session: AsyncSession, phone_number: str, limit: int = 10
    ) -> List[TransactionModel]:
        """Get user transaction history with caching"""
        cache_key = f"transactions:{phone_number}:{limit}"
        cached_transactions = await self.cache.get(cache_key)

        if cached_transactions:
            logger.debug("Transaction history cache hit", phone=phone_number)
            return [TransactionModel(**tx) for tx in cached_transactions]

        result = await session.execute(
            select(TransactionModel)
            .where(TransactionModel.phone_number == phone_number)
            .order_by(TransactionModel.created_at.desc())
            .limit(limit)
        )
        transactions = result.scalars().all()

        if transactions:
            cache_data = [
                {
                    "transaction_id": tx.transaction_id,
                    "transaction_type": tx.transaction_type,
                    "amount_kes": tx.amount_kes,
                    "amount_btc": tx.amount_btc,
                    "status": tx.status,
                    "created_at": tx.created_at.isoformat(),
                }
                for tx in transactions
            ]
            await self.cache.set(cache_key, cache_data, ttl=600)
            logger.debug("Transaction history cached", phone=phone_number)

        return list(transactions)

    async def invalidate_user_cache(self, phone_number: str) -> None:
        """Invalidate all cached data for a user"""
        cache_keys = [
            f"user_session:{phone_number}",
            f"transactions:{phone_number}:*",  # Pattern deletion assumed
            # to be handled
        ]
        for key in cache_keys:
            await self.cache.delete(key)

        logger.debug("User cache invalidated", phone=phone_number)

    async def get_database_stats(
        self, session: AsyncSession
    ) -> Dict[str, Any]:
        """Get database performance statistics"""
        try:
            user_count_result = await session.execute(
                select(func.count(UserSessionModel.id)) # type: ignore
            )
            user_count = user_count_result.scalar()

            transaction_count_result = await session.execute(
                select(func.count(TransactionModel.id))
            )
            transaction_count = transaction_count_result.scalar()

            yesterday = datetime.utcnow() - timedelta(days=1)
            active_sessions_result = await session.execute(
                select(func.count(UserSessionModel.id)).where(
                    UserSessionModel.last_activity > yesterday
                )
            )
            active_sessions = active_sessions_result.scalar()

            return {
                "total_users": user_count,
                "total_transactions": transaction_count,
                "active_sessions_24h": active_sessions,
                "last_updated": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error("Error getting database stats", error=str(e))
            return {"error": str(e)}

    async def cleanup_old_data(self, session: AsyncSession) -> Dict[str, int]:
        """Clean up old data to maintain performance"""
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            old_messages_result = await session.execute(
                text(
                    """
                    DELETE FROM message_history
                    WHERE created_at < :cutoff_date
                    """
                ),
                {"cutoff_date": thirty_days_ago},
            )

            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            old_prices_result = await session.execute(
                text(
                    """
                    DELETE FROM bitcoin_prices
                    WHERE timestamp < :cutoff_date
                    """
                ),
                {"cutoff_date": seven_days_ago},
            )

            await session.commit()

            return {
                "messages_deleted": getattr(
                    old_messages_result, "rowcount", 0
                ),
                "prices_deleted": getattr(
                    old_prices_result, "rowcount", 0
                ),
            }

        except Exception as e:
            logger.error("Error during data cleanup", error=str(e))
            await session.rollback()
            return {"messages_deleted": 0, "prices_deleted": 0}
