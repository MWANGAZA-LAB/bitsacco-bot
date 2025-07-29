# 🚀 Developer Setup Guide

## Quick Start

1. **Install Python 3.11+** and ensure it's in your PATH
2. **Open in VS Code** - The workspace is pre-configured
3. **Install recommended extensions** when prompted
4. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```
5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
6. **Copy environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

## VS Code Integration

### Available Tasks (Ctrl+Shift+P → "Tasks: Run Task")

| Task | Purpose | Shortcut |
|------|---------|----------|
| `🤖 Start Bot` | Run the WhatsApp bot | F5 |
| `🧪 Run Tests` | Execute test suite with coverage | Ctrl+Shift+T |
| `🔧 Format Code` | Auto-format with Black | Alt+Shift+F |
| `🔍 Lint Code` | Check code quality | Ctrl+Shift+L |
| `📝 Type Check` | Run MyPy type checking | Ctrl+T |
| `📦 Install Dependencies` | Install/update packages | |
| `🔄 Development Server` | Start FastAPI with hot reload | |
| `🐳 Docker Build` | Build container image | |
| `🚀 Docker Run` | Run containerized bot | |

### Debug Configurations

- **🤖 Debug Bot** - Debug the main WhatsApp bot
- **🌐 Debug FastAPI** - Debug the web API server
- **📁 Debug Current File** - Debug any Python file
- **🧪 Debug Tests** - Debug pytest tests
- **📄 Debug Current Test** - Debug current test file

### Code Snippets

Type these prefixes in Python files:

- `fastapi-service` - Create FastAPI service class
- `async-func-log` - Async function with logging
- `pydantic-model` - Pydantic data model
- `sqlalchemy-model` - Database model
- `fastapi-route` - API endpoint
- `test-async` - Async test function
- `whatsapp-handler` - WhatsApp message handler

## Development Workflow

### 1. Code Changes
```bash
# Format code automatically on save
# Or manually: Ctrl+Shift+P → "Format Document"

# Check code quality
flake8 src/
mypy src/
```

### 2. Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test
pytest tests/test_whatsapp.py::test_send_message
```

### 3. Running the Bot
```bash
# Development (auto-reload)
python src/index.py

# Or use VS Code task: Ctrl+Shift+P → "Tasks: Run Task" → "🤖 Start Bot"
```

### 4. API Development
```bash
# Start FastAPI server
uvicorn src.server.app:app --reload --port 8000

# API docs: http://localhost:8000/docs
```

## Code Quality Standards

### Formatting
- **Black** formatter (line length: 88)
- **isort** for import sorting
- Auto-format on save enabled

### Linting
- **Flake8** for code quality
- **MyPy** for type checking
- **Bandit** for security scanning

### Testing
- **pytest** framework
- Async test support with `pytest-asyncio`
- Coverage reports with `pytest-cov`
- Mock external APIs in tests

## Project Structure

```
src/
├── index.py              # Main bot entry point
├── bots/
│   └── whatsapp.js       # WhatsApp bot implementation
├── config/
│   └── index.js          # Configuration management
├── services/
│   ├── bitcoin.js        # Bitcoin price/transaction services
│   └── bitsaccoApi.js    # Bitsacco API integration
└── utils/
    └── logger.js         # Structured logging

tests/
├── setup.js              # Test configuration
└── unit/                 # Unit tests
```

## Environment Configuration

### Required Environment Variables

```bash
# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Bitsacco API
BITSACCO_API_URL=https://api.bitsacco.com
BITSACCO_API_KEY=your_api_key

# Bitcoin Services
BITCOIN_API_URL=https://api.blockchain.info
MEMPOOL_API_URL=https://mempool.space/api

# OpenAI
OPENAI_API_KEY=your_openai_key

# Database
DATABASE_URL=postgresql://user:pass@localhost/bitsacco_bot

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Logging
LOG_LEVEL=INFO
```

## Docker Development

### Build and Run
```bash
# Build image
docker build -t bitsacco-bot .

# Run container
docker run -d --name bitsacco-bot \
  --env-file .env \
  -p 8000:8000 \
  bitsacco-bot

# View logs
docker logs -f bitsacco-bot
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop services
docker-compose down
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure virtual environment is activated
   - Check PYTHONPATH in VS Code settings
   - Verify dependencies are installed

2. **Type Checking Errors**
   - Install type stubs: `pip install types-requests`
   - Add `# type: ignore` for third-party issues
   - Configure MyPy in `pyproject.toml`

3. **Test Failures**
   - Mock external API calls
   - Use `pytest-mock` for mocking
   - Check async/await patterns

4. **WhatsApp Webhook Issues**
   - Verify webhook URL is accessible
   - Check verify token matches
   - Ensure HTTPS for production

### Debug Tips

- Use VS Code debugger with breakpoints
- Check structured logs for detailed information
- Use `print()` sparingly, prefer logging
- Test API endpoints with included Postman collection

## Performance Monitoring

### Health Checks
- `/health` - Application health status
- `/metrics` - Performance metrics
- `/status` - Service status dashboard

### Logging
- Structured JSON logging with `structlog`
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Correlation IDs for request tracing

## Security Best Practices

- Never commit secrets to Git
- Use environment variables for configuration
- Validate all inputs from WhatsApp
- Rate limit API endpoints
- Encrypt sensitive data at rest
- Regular security dependency updates

## Contributing

1. **Fork and Clone**
2. **Create Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Follow Code Standards** (pre-commit hooks enabled)
4. **Write Tests** (coverage > 90%)
5. **Submit Pull Request**

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit
pre-commit install

# Run on all files
pre-commit run --all-files
```

---

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: [Wiki](../../wiki)
- **API Docs**: http://localhost:8000/docs (when running)

**Happy Coding!** 🎉
