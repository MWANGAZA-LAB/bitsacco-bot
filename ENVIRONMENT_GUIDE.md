# 🌍 Environment Configuration Guide

This guide explains how to configure and manage environments for the Bitsacco WhatsApp Bot.

## 📁 Environment Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `.env` | Local development | Used during local development and testing |
| `.env.staging` | Staging environment | Template for staging deployments |
| `.env.production` | Production environment | Template for production deployments |
| `.env.docker` | Docker containers | Used by Docker Compose |

## 🚀 Quick Start

### Local Development
```bash
# Copy example environment file
cp .env.example .env

# Edit with your local settings
nano .env

# Run the application
python run.py
```

### Docker Development
```bash
# Edit Docker environment file
nano .env.docker

# Start with Docker Compose
docker-compose up -d
```

### Staging Deployment
```bash
# Environment variables are configured via GitHub Secrets
# See GITHUB_SECRETS.md for required secrets
```

### Production Deployment
```bash
# Environment variables are configured via GitHub Secrets
# Deployment happens automatically on main branch push
```

## 🔧 Environment Variables

### Core Application Settings
- `DEBUG`: Enable/disable debug mode
- `APP_NAME`: Application name for logging
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `HOST`: Server host address
- `PORT`: Server port number

### Security
- `SECRET_KEY`: JWT secret key (MUST be unique per environment)

### Database
- `DATABASE_URL`: Database connection string
- `DATABASE_ECHO`: Enable SQL query logging

### Cache & Session
- `REDIS_URL`: Redis connection string for caching

### External APIs
- `BITSACCO_API_KEY`: Bitsacco API authentication
- `OPENAI_API_KEY`: OpenAI API for AI features
- `ELEVENLABS_API_KEY`: ElevenLabs for voice features
- `COINGECKO_API_KEY`: CoinGecko for Bitcoin price data

### WhatsApp Configuration
- `WHATSAPP_SESSION_NAME`: WhatsApp session identifier
- `WHATSAPP_HEADLESS`: Run browser in headless mode
- `WHATSAPP_TIMEOUT`: Connection timeout

### Admin Access
- `ADMIN_USERNAME`: Admin panel username
- `ADMIN_PASSWORD`: Admin panel password

### Monitoring
- `SENTRY_DSN`: Sentry error tracking
- `NEW_RELIC_LICENSE_KEY`: New Relic monitoring

## 🔒 Security Best Practices

### 1. Environment Separation
- **Development**: Use test/dummy API keys
- **Staging**: Use staging-specific credentials
- **Production**: Use production credentials only

### 2. Secret Management
- Never commit `.env` files to version control
- Use GitHub Secrets for CI/CD environments
- Rotate secrets regularly (every 90 days)

### 3. Access Control
- Limit who can access production secrets
- Use different passwords for each environment
- Enable 2FA on all external service accounts

## 📊 Environment Comparison

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| Debug Mode | `true` | `false` | `false` |
| Log Level | `DEBUG` | `INFO` | `WARNING` |
| Database | SQLite | PostgreSQL | PostgreSQL |
| Redis | Local | Hosted | Hosted |
| OpenAI Model | `gpt-3.5-turbo` | `gpt-3.5-turbo` | `gpt-4-turbo-preview` |
| Session Timeout | 3600s | 3600s | 7200s |

## 🔄 Environment Lifecycle

### Development
1. Clone repository
2. Copy `.env` from template
3. Configure local services (Redis, etc.)
4. Run application locally

### Staging
1. Create pull request
2. CI/CD automatically deploys to staging
3. Test functionality
4. Merge to main for production

### Production
1. Merge to main branch
2. CI/CD automatically deploys to production
3. Monitor health and metrics
4. Rollback if issues detected

## 🚨 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```bash
   # Check if all required variables are set
   python -c "from app.config import settings; print(settings)"
   ```

2. **Database Connection Issues**
   ```bash
   # Verify database URL format
   # SQLite: sqlite+aiosqlite:///./path/to/db.db
   # PostgreSQL: postgresql+asyncpg://user:pass@host:port/db
   ```

3. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   redis-cli -u redis://localhost:6379/0 ping
   ```

4. **API Key Issues**
   ```bash
   # Verify API keys are not expired
   # Check service-specific documentation
   ```

### Environment Validation

Run the environment validation script:
```bash
python -m app.utils.validate_env
```

## 📝 Adding New Environment Variables

1. **Add to Configuration Class**
   ```python
   # In app/config.py
   NEW_SETTING: str = "default_value"
   ```

2. **Update Environment Files**
   ```bash
   # Add to all .env files
   NEW_SETTING=environment_specific_value
   ```

3. **Update GitHub Secrets**
   ```bash
   # Add secrets for staging/production
   STAGING_NEW_SETTING
   PRODUCTION_NEW_SETTING
   ```

4. **Update Documentation**
   - Add to this README
   - Update GITHUB_SECRETS.md
   - Document in code comments

## 🔗 Related Documentation

- [GitHub Secrets Configuration](./GITHUB_SECRETS.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Development Guide](./DEVELOPMENT.md)
- [API Documentation](./docs/api.md)

---

For questions or issues, please create a GitHub issue or contact the development team.
