# Bitsacco Admin Dashboard Deployment Guide

## Quick Start

### 1. Backend Setup

1. **Install Dependencies**
   ```bash
   cd bitsacco-bot
   pip install -r requirements.txt
   pip install aiosqlite  # For SQLite async support
   ```

2. **Environment Configuration**
   Create `.env` file in the root directory:
   ```env
   # API Keys (Optional for demo)
   OPENAI_API_KEY=your_openai_api_key
   BITSACCO_API_KEY=your_bitsacco_api_key
   COINGECKO_API_KEY=your_coingecko_api_key
   
   # Database
   DATABASE_URL=sqlite+aiosqlite:///./bitsacco.db
   
   # App Settings
   APP_NAME=Bitsacco WhatsApp Bot
   VERSION=3.0.0
   DEBUG=true
   ```

3. **Start Backend Server**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   
   Backend will be available at: http://localhost:8000
   API Documentation: http://localhost:8000/docs

### 2. Admin Dashboard Setup

1. **Navigate to Dashboard Directory**
   ```bash
   cd admin-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   Create `.env` file in `admin-dashboard/` directory:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_APP_TITLE=Bitsacco Admin Dashboard
   VITE_APP_VERSION=1.0.0
   VITE_DEBUG=true
   ```

4. **Start Dashboard**
   ```bash
   npm run dev
   ```
   
   Dashboard will be available at: http://localhost:5173

## Features Available

### Backend API Endpoints
- ✅ **Health Check**: `/health`
- ✅ **Analytics**: `/api/analytics/{period}`
- ✅ **Metrics**: `/api/metrics`
- ✅ **Voice Settings**: `/api/voice/settings`
- ✅ **System Settings**: `/api/system/settings`
- ✅ **WhatsApp Status**: `/api/whatsapp/status`
- ✅ **Message History**: `/api/messages/history`
- ✅ **System Logs**: `/api/system/logs`
- ✅ **User Management**: `/api/users`

### Admin Dashboard Components
- ✅ **Analytics Dashboard**: Real-time metrics and charts
- ✅ **User Management**: View and manage users
- ✅ **Voice Settings**: Configure AI voice responses
- ✅ **System Settings**: Application configuration
- ✅ **Message History**: View conversation logs
- ✅ **System Logs**: Monitor application logs

## Production Deployment

### Backend (FastAPI)
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (React)
```bash
# Build for production
npm run build

# Serve with any static server (nginx, apache, etc.)
# Or deploy to Netlify, Vercel, etc.
```

## Environment Variables Reference

### Backend (.env)
```env
# Required for full functionality
OPENAI_API_KEY=sk-...
BITSACCO_API_KEY=your_key
COINGECKO_API_KEY=your_key

# Database
DATABASE_URL=sqlite+aiosqlite:///./bitsacco.db

# Optional
REDIS_URL=redis://localhost:6379
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (admin-dashboard/.env)
```env
# Required
VITE_API_URL=http://localhost:8000

# Optional
VITE_APP_TITLE=Bitsacco Admin Dashboard
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
```

## Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test categories
python -m pytest tests/test_api.py -v
python -m pytest tests/test_services.py -v
python -m pytest tests/test_integration.py -v
```

## Troubleshooting

### Common Issues

1. **Module not found: aiosqlite**
   ```bash
   pip install aiosqlite
   ```

2. **CORS errors in dashboard**
   - Ensure `VITE_API_URL` matches backend URL
   - Check CORS_ORIGINS in backend config

3. **Database connection errors**
   - Ensure DATABASE_URL is correct
   - Check file permissions for SQLite

4. **API endpoints not working**
   - Verify backend server is running
   - Check `/docs` endpoint for API documentation
   - Ensure all routes are registered in `main.py`

## Next Steps

1. **Configure Real API Keys**: Replace placeholder keys with actual API credentials
2. **Database Migration**: Set up production database (PostgreSQL recommended)
3. **Authentication**: Implement user authentication for admin dashboard
4. **Monitoring**: Add logging and monitoring for production
5. **Security**: Configure HTTPS, rate limiting, and security headers
