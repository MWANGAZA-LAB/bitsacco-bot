"""
Database session management for Bitsacco WhatsApp Bot
Async database connectivity with SQLAlchemy
"""

from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.pool import StaticPool
from contextlib import asynccontextmanager

from ..config import settings
from .models import Base


class DatabaseManager:
    """Manages database connections and sessions"""

    def __init__(self):
        self.engine: Optional[AsyncEngine] = None
        self.async_session_maker: Optional[async_sessionmaker] = None

    async def initialize(self, database_url: Optional[str] = None) -> None:
        """Initialize database connection"""
        db_url = database_url or settings.DATABASE_URL

        # Configure engine based on database type
        if "sqlite" in db_url:
            self.engine = create_async_engine(
                db_url,
                echo=settings.DATABASE_ECHO,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False},
            )
        else:
            self.engine = create_async_engine(
                db_url,
                echo=settings.DATABASE_ECHO,
                pool_pre_ping=True,
            )

        self.async_session_maker = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def create_tables(self) -> None:
        """Create all database tables"""
        if not self.engine:
            raise RuntimeError("Database not initialized")

        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close(self) -> None:
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get async database session with context management"""
        if not self.async_session_maker:
            raise RuntimeError("Database not initialized")

        async with self.async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


# Global database manager instance
db_manager = DatabaseManager()


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI to get database sessions"""
    async with db_manager.get_session() as session:
        yield session


async def init_database() -> None:
    """Initialize database for application startup"""
    await db_manager.initialize()
    await db_manager.create_tables()


async def close_database() -> None:
    """Close database connections for application shutdown"""
    await db_manager.close()
