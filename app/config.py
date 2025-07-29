"""
Configuration management for Bitsacco WhatsApp Bot
Production-ready settings with environment variable support
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    APP_NAME: str = "Bitsacco WhatsApp Bot"
    VERSION: str = "3.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000"],
        env="CORS_ORIGINS"
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://user:pass@localhost/bitsacco",
        env="DATABASE_URL"
    )
    DATABASE_ECHO: bool = Field(default=False, env="DATABASE_ECHO")

    # Redis (Caching & Sessions)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    REDIS_SESSION_DB: int = Field(default=1, env="REDIS_SESSION_DB")
    REDIS_CACHE_DB: int = Field(default=2, env="REDIS_CACHE_DB")

    # Bitsacco API
    BITSACCO_API_URL: str = Field(..., env="BITSACCO_API_URL")
    BITSACCO_API_KEY: str = Field(..., env="BITSACCO_API_KEY")
    BITSACCO_TIMEOUT: int = Field(default=30, env="BITSACCO_TIMEOUT")

    # WhatsApp
    WHATSAPP_SESSION_NAME: str = Field(
        default="bitsacco-session",
        env="WHATSAPP_SESSION_NAME"
    )
    WHATSAPP_HEADLESS: bool = Field(default=True, env="WHATSAPP_HEADLESS")
    WHATSAPP_TIMEOUT: int = Field(default=60, env="WHATSAPP_TIMEOUT")

    # OpenAI
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-4", env="OPENAI_MODEL")
    OPENAI_MAX_TOKENS: int = Field(default=1000, env="OPENAI_MAX_TOKENS")

    # Bitcoin Price API
    COINGECKO_API_KEY: Optional[str] = Field(
        default=None,
        env="COINGECKO_API_KEY"
    )
    BITCOIN_PRICE_UPDATE_INTERVAL: int = Field(
        default=60,
        env="BITCOIN_PRICE_UPDATE_INTERVAL"
    )
    BITCOIN_PRICE_CACHE_TTL: int = Field(
        default=300,
        env="BITCOIN_PRICE_CACHE_TTL"
    )

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")

    # File Paths
    DATA_DIR: Path = Field(default=Path("data"), env="DATA_DIR")
    LOGS_DIR: Path = Field(default=Path("logs"), env="LOGS_DIR")
    TEMP_DIR: Path = Field(default=Path("temp"), env="TEMP_DIR")

    # Session Management
    SESSION_TIMEOUT: int = Field(default=1800, env="SESSION_TIMEOUT")  # 30 min
    SESSION_CLEANUP_INTERVAL: int = Field(
        default=300,
        env="SESSION_CLEANUP_INTERVAL"
    )  # 5 min

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60,
        env="RATE_LIMIT_PER_MINUTE"
    )
    RATE_LIMIT_BURST: int = Field(default=10, env="RATE_LIMIT_BURST")

    # Celery (Background Tasks)
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/3",
        env="CELERY_BROKER_URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/4",
        env="CELERY_RESULT_BACKEND"
    )

    @validator("ALLOWED_HOSTS", pre=True)
    def parse_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v

    @validator("CORS_ORIGINS", pre=True)
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @validator("DATA_DIR", "LOGS_DIR", "TEMP_DIR")
    def create_directories(cls, v):
        if isinstance(v, str):
            v = Path(v)
        v.mkdir(parents=True, exist_ok=True)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Environment-specific configurations
def get_database_url() -> str:
    """Get database URL with proper connection pooling"""
    if settings.DEBUG:
        return settings.DATABASE_URL

    # Production database with connection pooling
    if "?" in settings.DATABASE_URL:
        return f"{settings.DATABASE_URL}&pool_size=20&max_overflow=30"
    else:
        return f"{settings.DATABASE_URL}?pool_size=20&max_overflow=30"


def get_redis_config() -> dict:
    """Get Redis configuration for different use cases"""
    return {
        "url": settings.REDIS_URL,
        "session_db": settings.REDIS_SESSION_DB,
        "cache_db": settings.REDIS_CACHE_DB,
        "encoding": "utf-8",
        "decode_responses": True,
        "socket_timeout": 5,
        "socket_connect_timeout": 5,
        "retry_on_timeout": True,
        "health_check_interval": 30
    }


def is_production() -> bool:
    """Check if running in production environment"""
    return not settings.DEBUG and os.getenv("ENVIRONMENT") == "production"


def get_log_config() -> dict:
    """Get logging configuration"""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s"
            },
            "simple": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json" if settings.LOG_FORMAT == "json" else "simple",
                "level": settings.LOG_LEVEL
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": settings.LOGS_DIR / "bitsacco-bot.log",
                "formatter": "json",
                "level": settings.LOG_LEVEL,
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            }
        },
        "loggers": {
            "": {
                "handlers": ["console", "file"],
                "level": settings.LOG_LEVEL,
                "propagate": False
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False
            }
        }
    }
