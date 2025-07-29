# 🤖 Bitsacco WhatsApp Assistant

<div align="center">

[![Build Status](https://github.com/MWANGAZA-LAB/bitsa## 🚀 **Core Features**

### 🔐 **SACCO Member Authentication**
- Phone number registration with Bitsacco SACCO
- Member verification and onboarding
- Secure session management for SACCO services

### 💰 **Bitcoin Savings Services**
- **Real-time Bitcoin prices** in USD and KES
- **Convert KES to Bitcoin** through SACCO deposits
- **Individual savings accounts** with Bitcoin storage
- **Group savings (Chamas)** for collective investment

### 🏦 **SACCO Integration**
- Direct integration with Bitsacco SACCO systems
- Member profile and savings synchronization
- M-Pesa integration for KES deposits
- SACCO-compliant transaction processing

### 👥 **Chama Group Services**
- Join or create Chama savings groups
- Collective Bitcoin savings and investment
- Group financial planning and targets
- Shared savings progress trackingCI%2FCD%20Pipeline/badge.svg)](https://github.com/MWANGAZA-LAB/bitsacco-bot/actions)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bitsacco-bot&metric=security_rating)](https://sonarcloud.io/dashboard?id=bitsacco-bot)
[![Coverage](https://codecov.io/gh/MWANGAZA-LAB/bitsacco-bot/branch/main/graph/badge.svg)](https://codecov.io/gh/MWANGAZA-LAB/bitsacco-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue.svg)](https://python.org/)

**Enterprise WhatsApp Assistant for seamless https://bitsacco.com/ services integration**

[Features](#-core-features) • [Quick Start](#-quick-start) • [Architecture](#-system-architecture) • [Database](#-database-schema) • [Contributing](#-contributing)

</div>

---

## 🎯 **Project Overview**

**Bitsacco WhatsApp Assistant** is a hybrid Python + TypeScript application that provides seamless user interaction with Bitsacco SACCO services through WhatsApp. Bitsacco is a Kenyan-based Savings and Credit Cooperative Organization (SACCO) that integrates Bitcoin into its financial services, offering members the ability to save individually or through group savings schemes known as "Chamas," enabling them to deposit Kenyan Shillings and convert them into Bitcoin.

**Architecture:** Hybrid Python (FastAPI) + TypeScript (Node.js)  
**Platform:** WhatsApp Business Integration  
**Target Users:** Kenyan SACCO members, underserved communities, Chama groups  
**Services:** Bitcoin savings, group investments, cooperative financial services  
**Languages:** English and Swahili support  

## 🤖 **Simple Bot Flow**

### **1. Welcome & Authentication**
```
👋 User: "Hi"
🤖 Bot: "Welcome to Bitsacco! 🪙 
        Please send your phone number to get started.
        Example: +254712345678"

👤 User: "+254712345678"
🤖 Bot: "✅ Account found! You're ready to use Bitsacco services.
        Type 'menu' to see available options."
```

### **2. Main Menu**
```
👤 User: "menu"
🤖 Bot: "🏠 *Bitsacco SACCO Services Menu*

💰 Type 'balance' - Check your savings balance
📈 Type 'price' - Current Bitcoin price
� Type 'save' - Deposit KES and save in Bitcoin
� Type 'chama' - Group savings with your Chama
📊 Type 'history' - View savings history
❓ Type 'help' - Get support

What would you like to do today?"
```

### **3. Check Bitcoin Price**
```
👤 User: "price"
🤖 Bot: "💰 *Current Bitcoin Price*

🇺🇸 USD: $67,500
🇰🇪 KES: KSH 8,775,000
📈 24h Change: +2.45%

⏰ Updated: 2:30 PM
💡 Type 'save' to start saving in Bitcoin"
```

### **4. Check SACCO Savings Balance**
```
👤 User: "balance"
🤖 Bot: "💼 *Your Bitsacco SACCO Account*

💰 Total Savings: KSH 50,000
₿ Bitcoin Equivalent: 0.0057 BTC
� Individual Savings: KSH 30,000
👥 Chama Savings: KSH 20,000

📈 Growth: +8.2% this month
🎯 Type 'save' to add more savings"
```

### **5. Save Money (Deposit KES to Bitcoin)**
```
👤 User: "save"
🤖 Bot: "� *Save with Bitsacco SACCO*
        
How much would you like to save today?
• Minimum: KSH 100
• Example: Type '5000' for KSH 5,000"

👤 User: "5000"
🤖 Bot: "📋 *Savings Summary*

Amount: KSH 5,000
Bitcoin Rate: KSH 8,775,000 per BTC
You'll receive: ~0.00057 BTC
SACCO Fee: KSH 50

Reply 'confirm' to save or 'cancel'"

👤 User: "confirm"
🤖 Bot: "✅ *Savings Confirmed!*

M-Pesa payment request sent to +254712345678
Reference: SAV_abc123
Your Bitcoin will be credited after payment

🏦 Thank you for saving with Bitsacco SACCO!"
```

## 🚀 **Core Features**

### � **User Authentication**
- Phone number registration with https://bitsacco.com/
- Secure session management
- Account verification and KYC integration

### 💰 **Bitcoin Services**
- **Real-time Bitcoin prices** in USD and KES
- **Wallet management** - check balances, addresses
- **Send/Receive Bitcoin** with contact integration
- **Transaction history** and status tracking

### 🏦 **Bitsacco.com/ Integration**
- Direct API integration with https://bitsacco.com/ services
- User profile synchronization
- Account management and preferences
- Secure transaction processing

### 🎤 **Voice Features** (Optional)
- Text-to-speech responses using ElevenLabs
- Audio savings confirmations and updates
- Voice-guided SACCO services
- Multi-language voice support (English/Swahili)

### 🔧 **Technical Features**
- Hybrid Python + TypeScript architecture
- Real-time Bitcoin price tracking
- M-Pesa payment gateway integration
- Comprehensive SACCO compliance and logging

## 🏗️ **Hybrid Architecture**

### **TypeScript Backend (Node.js)**
- WhatsApp Web.js integration for messaging
- Real-time Bitcoin price tracking
- Message processing and routing
- Session management and caching

### **Python Backend (FastAPI)**
- Bitsacco SACCO API integration
- Bitcoin savings account operations
- Member authentication and management
- KES to Bitcoin conversion processing
- Database operations and SACCO compliance

### **Architecture Flow**
```
WhatsApp User → TypeScript Service → Python Service → Bitsacco SACCO API
             ↓                    ↓                ↓
        Message Processing → Business Logic → Savings Processing
             ↓                    ↓                ↓
        Response Routing ← SACCO Services ← M-Pesa Integration
```

### **Key Components**
- **WhatsApp Bot** (`src/bots/whatsapp.ts`) - Message handling
- **Bitcoin Service** (`src/services/bitcoin.ts`) - Price tracking
- **Python API** (`python/main.py`) - Core SACCO business logic
- **Bitsacco Integration** (`python/services/bitsacco_api.py`) - SACCO API
- **Database Models** (`python/models/`) - Member and savings data

## � **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.8+ and pip
- WhatsApp account for bot authentication

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/MWANGAZA-LAB/bitsacco-bot.git
cd bitsacco-bot
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

5. **Start the hybrid application**
```bash
# Development mode (both TypeScript and Python)
npm run dev

# Or start services separately:
# Terminal 1: TypeScript service
npm run build:ts && npm start

# Terminal 2: Python service  
cd python && python main.py
```

6. **Authenticate WhatsApp**
- Scan the QR code with your WhatsApp app to authenticate the bot session

### **Environment Configuration**

```bash
# WhatsApp Configuration
WHATSAPP_SESSION_NAME=bitsacco-session

# Bitcoin Price API
COINGECKO_API_KEY=your_coingecko_api_key

# Voice Features (Optional)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Bitsacco Integration
BITSACCO_API_URL=https://api.bitsacco.com/
BITSACCO_API_KEY=your_bitsacco_sacco_api_key

# M-Pesa Integration (for KES deposits)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey

# Database
DATABASE_URL=postgresql://localhost/bitsacco
REDIS_URL=redis://localhost:6379

# Python Service
PYTHON_HOST=0.0.0.0
PYTHON_PORT=8000
```

## 📁 **Project Structure**

```
bitsacco-bot/
├── src/                        # TypeScript Backend
│   ├── index.ts               # Main application entry
│   ├── health-check.ts        # Health monitoring
│   ├── bots/
│   │   └── whatsapp.ts        # WhatsApp bot integration
│   ├── services/
│   │   ├── bitcoin.ts         # Bitcoin price service
│   │   ├── aiNlpEngine.ts     # AI conversation processing
│   │   └── auth.ts            # Authentication service
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── utils/
│   │   └── logger.ts          # Logging utilities
│   └── types/
│       └── index.ts           # TypeScript type definitions
│
├── python/                     # Python Backend (FastAPI)
│   ├── main.py                # FastAPI application
│   ├── config.py              # Python configuration
│   ├── services/
│   │   ├── bitsacco_api.py    # Bitsacco SACCO integration
│   │   ├── bitcoin_service.py # Bitcoin savings operations
│   │   ├── wallet_service.py  # Member savings management
│   │   └── mpesa_service.py   # M-Pesa payment integration
│   └── models/
│       └── __init__.py        # Database models (Members, Savings, Chamas)
│
├── scripts/                    # Development & Testing
│   ├── test-bitcoin-prices.ts # Bitcoin price testing
│   ├── test-price-direct.ts   # Direct API testing
│   ├── test-elevenlabs.ts     # Voice service testing
│   └── diagnostics.ts         # Project diagnostics
│
├── tests/                      # Test suites
├── public/                     # Static assets
├── .github/workflows/          # CI/CD pipeline
├── package.json               # Node.js dependencies
├── requirements.txt           # Python dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🧪 **Testing**

### **Test Bitcoin Price Service**
```bash
# Test real-time Bitcoin prices
npm run test:prices

# Direct CoinGecko API test
node scripts/test-price-direct.js
```

### **Test Voice Features**
```bash
# Test ElevenLabs configuration
node scripts/test-elevenlabs.js

# Simple voice configuration test
node scripts/test-elevenlabs-simple.js
```

### **Run Full Test Suite**
```bash
# TypeScript tests
npm test

# Python tests
cd python && python -m pytest
```

## 🛠️ **Development Scripts**

```bash
# Build TypeScript
npm run build:ts

# Start development mode
npm run dev

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Health check
npm run health-check
```

---

## 🔧 **API Integration**

### **Bitsacco SACCO Services**
The Python backend integrates with Bitsacco SACCO for:
- Member registration and authentication
- Individual and group savings account management
- KES to Bitcoin conversion and storage
- Chama group savings coordination
- SACCO compliance and regulatory reporting

### **External APIs**
- **CoinGecko API** - Real-time Bitcoin prices (USD/KES)
- **M-Pesa API** - KES deposit processing and payment gateway
- **ElevenLabs API** - Text-to-speech voice synthesis
- **OpenAI API** - Conversational AI and NLP processing

### **Internal Services**
- **TypeScript Service** (Port 3000) - WhatsApp messaging
- **Python Service** (Port 8000) - SACCO business logic and data
- **Redis** - Session and price caching
- **PostgreSQL** - Member data, savings records, and Chama information

## 📊 **Available Commands**

### **Basic Commands**
- `hi`, `hello`, `start` - Welcome message and menu
- `menu` - Show main service menu
- `help` - Get help and support information

### **Bitcoin Savings Services**
- `price` - Current Bitcoin price in USD/KES
- `balance` - Check SACCO savings balance
- `save` - Deposit KES and convert to Bitcoin
- `chama` - Join or manage group savings
- `history` - View savings and conversion history

### **SACCO Member Services**
- `profile` - View member information
- `goals` - Set savings targets and goals
- `statement` - Get detailed savings statement
- `voice on/off` - Toggle voice responses

## ❓ **FAQ**

**Q: What is Bitsacco?**  
A: Bitsacco is a Kenyan-based Savings and Credit Cooperative Organization (SACCO) that integrates Bitcoin into its financial services. It enables members to save individually or through group savings schemes (Chamas), depositing Kenyan Shillings and converting them into Bitcoin as an alternative financial system.

**Q: How do I start saving with Bitsacco SACCO?**  
A: Simply send "hi" to the bot, register with your phone number, and use the 'save' command to deposit KES and convert to Bitcoin through our SACCO services.

**Q: What are Chamas?**  
A: Chamas are group savings schemes where members pool their resources together for collective Bitcoin savings and investment, providing community-based financial support.

**Q: Is Bitsacco SACCO regulated and secure?**  
A: Yes. As a registered SACCO, Bitsacco operates under Kenyan cooperative regulations and uses secure Bitcoin storage solutions to protect member savings.

**Q: How does the KES to Bitcoin conversion work?**  
A: You deposit Kenyan Shillings through M-Pesa, and Bitsacco SACCO converts them to Bitcoin at current market rates, storing the Bitcoin in your individual or group savings account.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for Africa's Bitcoin Future**