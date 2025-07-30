# Bitsacco WhatsApp Bot

**Transform your M-Pesa savings into Bitcoin through simple WhatsApp conversations**

A production-ready, intelligent WhatsApp bot that revolutionizes Bitcoin savings in Kenya. Built with enterprise-grade Python architecture featuring FastAPI, AI-powered conversations, and seamless M-Pesa integration through the Bitsacco platform.

## 🌟 Features

- **WhatsApp Web Integration**: Automated message handling via Selenium WebDriver
- **Bitcoin Price Tracking**: Real-time Bitcoin prices in USD and KES
- **User Authentication**: Secure phone number verification with OTP
- **AI Conversations**: Intelligent responses powered by OpenAI
- **Bitcoin Savings**: Integration with Bitsacco.com API for savings management
- **Session Management**: Persistent user sessions with state tracking
- **Production Ready**: Comprehensive logging, health monitoring, and error handling

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp Web  │◄──►│   FastAPI App    │◄──►│  Bitsacco API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼──┐   ┌────▼────┐   ┌──▼──────┐
            │ Database │   │ OpenAI  │   │ Bitcoin │
            │(SQLite)  │   │   API   │   │Price API│
            └──────────┘   └─────────┘   └─────────┘
```

## 🛠️ Tech Stack

- **Framework**: FastAPI (async web framework)
- **WhatsApp**: Selenium WebDriver (Chrome automation)
- **AI**: OpenAI GPT-3.5/4 (conversation intelligence)
- **Database**: SQLAlchemy + SQLite/PostgreSQL
- **HTTP Client**: httpx (async HTTP requests)
- **Logging**: structlog (structured logging)
- **Testing**: pytest (async testing framework)
- **Cache**: Redis (optional, for performance)

## 📁 Project Structure

```
bitsacco-bot/
├── app/                       # Main application code
│   ├── main.py               # FastAPI application
│   ├── config.py             # Configuration management
│   ├── api/                  # API routes and webhooks
│   ├── services/             # Business logic services
│   ├── models/               # Pydantic data models
│   └── database/             # Database models and management
├── tests/                    # Test suite
├── requirements.txt          # Python dependencies
├── .env.example             # Environment template
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Multi-service deployment
├── run.py                   # Development runner
└── README.md                # This file

## 📋 Requirements

- Python 3.9+
- Chrome/Chromium browser
- ChromeDriver
- OpenAI API key
- Bitsacco API access

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/MWANGAZA-LAB/bitsacco-bot.git
cd bitsacco-bot
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 4. Setup Chrome WebDriver

```bash
# Download ChromeDriver for your Chrome version
# https://chromedriver.chromium.org/downloads

# Linux/Mac
sudo mv chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

# Windows
# Place chromedriver.exe in your PATH or specify path in .env
```

### 5. Run the Application

```bash
# Development mode (with auto-reload)
python run.py

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Connect WhatsApp

1. Open your browser and navigate to `http://localhost:8000`
2. The WhatsApp Web session will start automatically
3. Scan the QR code with your WhatsApp mobile app
4. The bot will be ready to receive messages

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_services.py

# Run integration tests
pytest -m integration
```

## 📊 Monitoring

### Health Checks

- **Basic**: `GET /health`
- **Detailed**: `GET /health/detailed`
- **Statistics**: `GET /stats`

### Logging

The application uses structured logging with different levels:

```python
# View logs in development
tail -f logs/app.log

# In production, logs go to stdout for container orchestration
```

## 🔧 Configuration

Key configuration options in `.env`:

```bash
# Core Settings
DEBUG=false
LOG_LEVEL=INFO
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db

# API Keys
OPENAI_API_KEY=sk-...
BITSACCO_API_KEY=your_key
COINGECKO_API_KEY=your_key

# WhatsApp
CHROME_HEADLESS=true
WHATSAPP_SESSION_TIMEOUT=3600

# Bitcoin Prices
BITCOIN_PRICE_UPDATE_INTERVAL=60
BITCOIN_PRICE_CACHE_TTL=300
```

## 🤖 Bot Commands

Users can interact with the bot using these commands:

### Authentication
- `start` - Begin phone verification
- `[OTP code]` - Verify with 6-digit code

### Bitcoin & Savings
- `price` - Current Bitcoin price
- `balance` - Your savings balance
- `save [amount]` - Start saving (e.g., "save 1000")
- `history` - Transaction history

### Information
- `help` - Available commands
- `market` - Market summary
- `profile` - Account information

### Natural Language
The bot also understands natural language:
- "What's the Bitcoin price?"
- "I want to save 5000 KES"
- "Show me my balance"

## 🔌 API Endpoints

### Webhooks
- `POST /webhook/whatsapp` - WhatsApp message webhook
- `GET /webhook/whatsapp` - Webhook verification

### Information
- `GET /bitcoin/price` - Current Bitcoin price
- `GET /stats` - Bot statistics

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.9-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \\
    chromium-browser \\
    chromium-chromedriver

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Considerations

1. **Database**: Use PostgreSQL instead of SQLite
2. **Cache**: Enable Redis for better performance
3. **Monitoring**: Set up proper monitoring and alerts
4. **Scaling**: Use multiple workers and load balancing
5. **Security**: Implement proper authentication and rate limiting

## 🔒 Security

- Phone number verification required
- OTP-based authentication
- Session management with timeouts
- Input validation and sanitization
- Structured logging for audit trails

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@bitsacco.com
- Documentation: https://docs.bitsacco.com
- Issues: Create a GitHub issue

---

**Built with ❤️ for the Bitsacco community**
