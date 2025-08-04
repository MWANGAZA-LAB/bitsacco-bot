"""
Database Configuration and Session Management
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import StaticPool
import structlog

from ..config import settings
from .models import Base

logger = structlog.get_logger(__name__)


class DatabaseManager:
    """Production database manager with connection pooling"""

    def __init__(self):
        self.engine = None
        self.async_session_maker = None
        self.is_connected = False

    async def connect(self) -> None:
        """Connect to database"""
        try:
            # Create async engine
            self.engine = create_async_engine(
                settings.DATABASE_URL,
                echo=settings.DEBUG,
                poolclass=(
                    StaticPool if "sqlite" in settings.DATABASE_URL else None
                ),
                connect_args=(
                    {"check_same_thread": False}
                    if "sqlite" in settings.DATABASE_URL
                    else {}
                ),
            )

            # Create session maker
            self.async_session_maker = async_sessionmaker(
                bind=self.engine, class_=AsyncSession, expire_on_commit=False
            )

            # Create tables
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            self.is_connected = True
            logger.info("✅ Database connected successfully")

        except Exception as e:
            logger.error("❌ Failed to connect to database", error=str(e))
            raise

    async def disconnect(self) -> None:
        """Disconnect from database"""
        if self.engine:
            await self.engine.dispose()
            self.is_connected = False
            logger.info("🛑 Database disconnected")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        if not self.async_session_maker:
            raise RuntimeError("Database not connected")

        async with self.async_session_maker() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def health_check(self) -> dict:
        """Database health check"""
        try:
            if not self.is_connected or not self.engine:
                return {"status": "unhealthy", "error": "Not connected"}

            # Test connection
            from sqlalchemy import text
            async with self.engine.begin() as conn:
                await conn.execute(text("SELECT 1"))

            return {"status": "healthy", "connected": True}

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}


# Global database manager instance
db_manager = DatabaseManager()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI routes"""
    async for session in db_manager.get_session():
        yield session
