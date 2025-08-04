# 🔐 GitHub Secrets Configuration Guide

This document lists all the GitHub Secrets that need to be configured for the Bitsacco WhatsApp Bot CI/CD pipeline.

## 📋 Required GitHub Secrets

### 🎭 Staging Environment Secrets

Navigate to: `Repository Settings > Secrets and variables > Actions > Repository secrets`

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `STAGING_SECRET_KEY` | JWT secret key for staging | `staging_super_secret_key_2024` |
| `STAGING_DB_USER` | PostgreSQL username for staging | `bitsacco_staging` |
| `STAGING_DB_PASSWORD` | PostgreSQL password for staging | `secure_staging_password` |
| `STAGING_DB_HOST` | PostgreSQL host for staging | `staging-db.bitsacco.com` |
| `STAGING_DB_NAME` | PostgreSQL database name | `bitsacco_staging` |
| `STAGING_REDIS_HOST` | Redis host for staging | `staging-redis.bitsacco.com` |
| `STAGING_BITSACCO_API_KEY` | Bitsacco API key for staging | `staging_api_key_xxxxx` |
| `STAGING_OPENAI_API_KEY` | OpenAI API key for staging | `sk-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `STAGING_ELEVENLABS_API_KEY` | ElevenLabs API key for staging | `el_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `STAGING_ELEVENLABS_VOICE_ID` | ElevenLabs voice ID for staging | `voice_id_xxxxxxxx` |
| `STAGING_COINGECKO_API_KEY` | CoinGecko API key for staging | `CG-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `STAGING_ADMIN_USERNAME` | Admin username for staging | `staging_admin` |
| `STAGING_ADMIN_PASSWORD` | Admin password for staging | `secure_staging_admin_pass` |
| `STAGING_SENTRY_DSN` | Sentry DSN for staging monitoring | `https://xxxxx@sentry.io/xxxxx` |
| `STAGING_NEW_RELIC_LICENSE_KEY` | New Relic license key for staging | `xxxxxxxxxxxxxxxxxxxxxxxx` |

### 🌟 Production Environment Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PRODUCTION_SECRET_KEY` | JWT secret key for production | `production_super_secret_key_2024` |
| `PRODUCTION_DB_USER` | PostgreSQL username for production | `bitsacco_prod` |
| `PRODUCTION_DB_PASSWORD` | PostgreSQL password for production | `ultra_secure_production_password` |
| `PRODUCTION_DB_HOST` | PostgreSQL host for production | `prod-db.bitsacco.com` |
| `PRODUCTION_DB_NAME` | PostgreSQL database name | `bitsacco_production` |
| `PRODUCTION_REDIS_HOST` | Redis host for production | `prod-redis.bitsacco.com` |
| `PRODUCTION_BITSACCO_API_KEY` | Bitsacco API key for production | `production_api_key_xxxxx` |
| `PRODUCTION_OPENAI_API_KEY` | OpenAI API key for production | `sk-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `PRODUCTION_ELEVENLABS_API_KEY` | ElevenLabs API key for production | `el_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `PRODUCTION_ELEVENLABS_VOICE_ID` | ElevenLabs voice ID for production | `voice_id_xxxxxxxx` |
| `PRODUCTION_COINGECKO_API_KEY` | CoinGecko API key for production | `CG-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `PRODUCTION_ADMIN_USERNAME` | Admin username for production | `admin` |
| `PRODUCTION_ADMIN_PASSWORD` | Admin password for production | `ultra_secure_admin_password` |
| `PRODUCTION_SENTRY_DSN` | Sentry DSN for production monitoring | `https://xxxxx@sentry.io/xxxxx` |
| `PRODUCTION_NEW_RELIC_LICENSE_KEY` | New Relic license key for production | `xxxxxxxxxxxxxxxxxxxxxxxx` |

## 📝 How to Configure Secrets

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click on "Settings" tab
   - Select "Secrets and variables" > "Actions"

2. **Add Repository Secrets**
   - Click "New repository secret"
   - Enter the secret name exactly as listed above
   - Enter the secret value
   - Click "Add secret"

3. **Verify Secrets**
   - All secrets should appear in the list
   - Secret values are hidden for security

## 🔒 Security Best Practices

- **Never commit secrets to version control**
- **Use strong, unique passwords for each environment**
- **Rotate secrets regularly (every 90 days)**
- **Use different API keys for staging and production**
- **Monitor secret usage in GitHub Actions logs**

## 🚀 Environment URLs

- **Staging**: https://staging-bot.bitsacco.com
- **Production**: https://bot.bitsacco.com
- **Admin Staging**: https://staging-admin.bitsacco.com
- **Admin Production**: https://admin.bitsacco.com

## 📊 Monitoring & Alerts

Configure these services for comprehensive monitoring:

- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Application performance monitoring
- **GitHub Actions**: CI/CD pipeline monitoring

## 🔄 Next Steps

1. Create all required secrets in GitHub repository settings
2. Test staging deployment with a pull request
3. Test production deployment with a main branch push
4. Monitor logs and metrics for successful deployments
5. Set up alerting for critical failures

---

**Note**: Replace all example values with your actual credentials. Keep this document private and secure.
