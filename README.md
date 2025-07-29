# 🏦 Bitsacco WhatsApp Bot

**Simple WhatsApp interface for Bitsacco SACCO Bitcoin savings**

A minimalistic WhatsApp bot that connects users to their existing Bitsacco.com accounts for seamless Bitcoin savings through M-Pesa.

## 📱 How It Works

### **User Flow**
```
1. User messages WhatsApp bot: "Save 1000 KES"
2. Bot extracts phone number from WhatsApp  
3. Bot calls Bitsacco.com API with phone number
4. Bitsacco sends M-Pesa prompt to user's phone
5. User completes M-Pesa payment
6. Bitsacco converts KES to Bitcoin & stores in SACCO account
7. Bot confirms transaction: "✅ 1000 KES → 0.00234 BTC saved!"
```

### **Prerequisites**
- User must have existing **Bitsacco.com account** (registered with same phone number)
- Account created at https://bitsacco.com/ with phone verification
- M-Pesa enabled for payments

## 🚀 Quick Start

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Add your API keys to .env
BITSACCO_API_KEY=your_bitsacco_api_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### **2. Install Dependencies**
```bash
# Node.js dependencies
npm install

# Python dependencies  
pip install -r requirements.txt
```

### **3. Run the Bot**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔌 Architecture

### **Bot Role: API Client Only**
The bot is a **thin interface layer** that:
- ✅ Parses WhatsApp messages 
- ✅ Calls Bitsacco.com APIs
- ✅ Formats responses for WhatsApp
- ❌ Does NOT handle wallets, transactions, or payments

### **Bitsacco.com Handles:**
- 🏦 User accounts & authentication
- 💰 Bitcoin wallet management  
- 💳 M-Pesa payment processing
- 📊 Transaction history & balances
- 🔐 Security & compliance

## 🛠 Core Commands

| WhatsApp Message | Bot Action |
|------------------|------------|
| `"Save 500"` | Initiates 500 KES → Bitcoin via Bitsacco API |
| `"Balance"` | Fetches account balance from Bitsacco |
| `"History"` | Shows recent transactions |
| `"Help"` | Displays available commands |

## 📂 Project Structure

```
bitsacco-bot/
├── src/                    # TypeScript WhatsApp bot
│   ├── bots/whatsapp.ts   # WhatsApp Web integration  
│   ├── services/
│   │   ├── bitsaccoApi.ts # Bitsacco.com API client
│   │   └── aiNlpEngine.ts # Message parsing
│   └── index.ts           # Main application
├── python/                 # Python API services  
│   └── services/
│       ├── wallet_service.py    # Bitsacco API client
│       └── bitcoin_service.py   # Price data only
└── .env                   # Your API keys (not committed)
```

## 🔐 Security

- ✅ All sensitive operations handled by Bitsacco.com
- ✅ Bot only stores temporary session data
- ✅ Phone number used as primary identifier  
- ✅ OTP verification through Bitsacco backend

## 🇰🇪 Kenya-First Design

- 💱 **KES-focused**: All amounts in Kenyan Shillings
- 📱 **M-Pesa integrated**: Native mobile payment flow
- 🏘️ **SACCO model**: Cooperative savings approach
- 🌍 **Swahili support**: Local language integration

## 📞 Support

For account issues, contact **Bitsacco.com support**.  
For bot technical issues, see GitHub issues.

---

**Built for Kenyan Bitcoin savers by Bitsacco SACCO** 🇰🇪₿