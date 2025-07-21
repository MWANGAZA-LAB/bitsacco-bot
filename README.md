# Bitsacco Bot 🚀

**Multi-Platform Bitcoin & Lightning Bot for Africa**

Bitsacco Bot is a comprehensive, multi-platform chatbot designed to bring Bitcoin and Lightning Network payments to African communities. It supports Telegram, Discord, WhatsApp, and Web interfaces with multilingual support (English, Swahili, French).

## ✨ Features

### 🌍 **Multi-Platform Support**
- **Telegram Bot** - Interactive commands with inline keyboards
- **Discord Bot** - Slash commands with rich embeds  
- **WhatsApp Bot** - Message-based interaction with QR codes
- **Web Chat** - Real-time browser interface with Socket.IO

### ⚡ **Bitcoin & Lightning Integration**
- Lightning invoice generation with QR codes
- Bitcoin wallet balance checking
- Payment sending and receiving
- Real-time Bitcoin price updates
- Transaction history tracking

### 🗣️ **Multilingual Support**
- **English** - Primary language
- **Kiswahili** - For East African communities
- **Français** - For West/Central African communities
- Easy language switching per user

### 📚 **Educational Features**
- Bitcoin basics education
- Lightning Network explanations
- Security best practices
- Africa-focused Bitcoin adoption content

### 🛡️ **Production Ready**
- Comprehensive logging with Winston
- Error handling and graceful shutdown
- Rate limiting and security headers
- Docker support (coming soon)
- Environment-based configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Bot tokens (optional for testing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/bitsacco-bot.git
cd bitsacco-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your bot tokens and configuration
```

4. **Start the application**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Individual bot services
npm run telegram   # Telegram bot only
npm run discord    # Discord bot only
npm run whatsapp   # WhatsApp bot only
npm run web        # Web chat only
```

## 📁 Project Structure

```
bitsacco-bot/
├── src/
│   ├── bots/              # Bot implementations
│   │   ├── telegram.js    # Telegram bot service
│   │   ├── discord.js     # Discord bot service
│   │   ├── whatsapp.js    # WhatsApp bot service
│   │   └── web.js         # Web chat server
│   ├── config/            # Configuration management
│   │   └── index.js       # Environment config
│   ├── services/          # Core services
│   │   ├── bitcoin.js     # Bitcoin/Lightning service
│   │   └── i18n.js        # Internationalization
│   ├── server/            # Web server
│   │   └── web.js         # Express + Socket.IO server
│   ├── utils/             # Utilities
│   │   └── logger.js      # Winston logger
│   └── index.js           # Main application entry
├── public/                # Web interface assets
│   └── index.html         # Chat web interface
├── logs/                  # Application logs
├── package.json           # Dependencies and scripts
└── .env.example           # Environment template
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Bot Tokens
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
DISCORD_BOT_TOKEN=your_discord_bot_token

# Bitcoin/Lightning (for production)
LIGHTNING_NODE_URI=https://your-lightning-node.com
LIGHTNING_MACAROON=your_macaroon_here

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/bitsacco-bot
REDIS_URL=redis://localhost:6379

# Features
ENABLE_PAYMENTS=true
ENABLE_NOTIFICATIONS=true
ENABLE_ANALYTICS=true

# Languages
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,sw,fr
```

### Bot Setup

#### 1. Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Get your token and add to `.env`

#### 2. Discord Bot  
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application → Bot tab
3. Get token and add to `.env`
4. Invite bot to your server with appropriate permissions

#### 3. WhatsApp Bot
1. Install with `npm install`
2. Run `npm run whatsapp`
3. Scan QR code with WhatsApp to authenticate
4. Session will be saved for future use

#### 4. Web Chat
1. Automatically available at `http://localhost:3000`
2. No additional setup required

## 💡 Usage Examples

### Telegram Commands
```
/start - Welcome message with quick actions
/balance - Check Bitcoin wallet balance  
/send 1000 - Send 1000 satoshis
/receive 5000 - Request 5000 satoshis
/price - Current Bitcoin price
/language - Change language preference
/education - Learn about Bitcoin
```

### Discord Slash Commands
```
/start - Get started with Bitsacco
/balance - View wallet balance
/send amount:1000 - Send Bitcoin payment
/receive amount:5000 - Generate payment request
/price - Bitcoin price info
/language lang:sw - Change to Swahili
```

### WhatsApp Messages
```
/start - Begin conversation
/balance - Check balance
/send 1000 - Send payment
/receive 5000 - Request payment
/help - List all commands
```

### Web Chat
- Natural language: "Check my balance"
- Commands: Click buttons or type messages
- Real-time responses with rich media

## 🌍 Multilingual Support

The bot supports three languages optimized for African communities:

- **English (en)** - International standard
- **Kiswahili (sw)** - East Africa (Kenya, Tanzania, Uganda)
- **Français (fr)** - West/Central Africa (Senegal, Côte d'Ivoire, DRC)

Users can change language preferences:
- Telegram: `/language` command
- Discord: `/language` slash command  
- WhatsApp: Send `/language`
- Web: Click language buttons

## 🔧 Development

### Available Scripts

```bash
npm start          # Start all bots (production)
npm run dev        # Development with nodemon
npm run telegram   # Telegram bot only
npm run discord    # Discord bot only  
npm run whatsapp   # WhatsApp bot only
npm run web        # Web server only
npm test           # Run tests
```

### Adding New Features

1. **New Commands**: Add to respective bot files in `src/bots/`
2. **New Languages**: Update `src/services/i18n.js`
3. **New Services**: Create in `src/services/`
4. **Bitcoin Features**: Extend `src/services/bitcoin.js`

### Testing

```bash
# Run tests
npm test

# Test individual bots
npm run telegram &
# Then test with @YourBotName on Telegram
```

## 🚀 Deployment

### Local Production
```bash
# Install dependencies
npm ci --production

# Set production environment
export NODE_ENV=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start src/index.js --name bitsacco-bot

# Or start directly
npm start
```

### Docker (Coming Soon)
```bash
# Build image
docker build -t bitsacco-bot .

# Run container  
docker run -d --env-file .env -p 3000:3000 bitsacco-bot
```

### Environment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure bot tokens
- [ ] Set up Bitcoin/Lightning node
- [ ] Configure database connections
- [ ] Set up reverse proxy (nginx)
- [ ] Configure SSL certificates
- [ ] Set up monitoring/logging

## 🤝 Contributing

We welcome contributions from the African Bitcoin community!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation
- Test on multiple platforms
- Consider African use cases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌍 Community

- **Telegram**: [@BitsaccoAfrica](https://t.me/BitsaccoAfrica)
- **Discord**: [Bitsacco Community](https://discord.gg/bitsacco)
- **Twitter**: [@BitsaccoAfrica](https://twitter.com/BitsaccoAfrica)
- **Email**: support@bitsacco.com

## 🙏 Acknowledgments

- **African Bitcoin Community** - For inspiration and feedback
- **Lightning Network** - For instant Bitcoin payments
- **Open Source Libraries** - Making this project possible
- **African Developers** - Building the future of money in Africa

## 🔮 Roadmap

### Phase 1 (Current) ✅
- [x] Multi-platform bot support
- [x] Basic Bitcoin functionality
- [x] Multilingual interface
- [x] Web chat interface

### Phase 2 (Q2 2025)
- [ ] Real Lightning Network integration
- [ ] Mobile app companion
- [ ] Advanced payment features
- [ ] Analytics dashboard

### Phase 3 (Q3 2025)
- [ ] Merchant integration tools
- [ ] Community features
- [ ] Advanced education modules
- [ ] Mobile money integration

### Phase 4 (Q4 2025)
- [ ] DeFi integrations
- [ ] Multi-currency support
- [ ] Advanced trading features
- [ ] Enterprise solutions

---

**Made with ❤️ for Africa's Bitcoin Future**

*Empowering African communities with accessible Bitcoin and Lightning Network technology.*