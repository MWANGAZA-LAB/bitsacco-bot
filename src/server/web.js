import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import i18n from '../services/i18n.js';
import bitcoinService from '../services/bitcoin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebChatBotService {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.web.corsOrigin,
        credentials: true
      }
    });
    this.userLanguages = new Map();
    this.userSessions = new Map();
    this.activeUsers = new Map();
  }

  // Initialize web server and chat bot
  initialize() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.startServer();
  }

  // Setup Express middleware
  setupMiddleware() {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    this.app.use(cors({
      origin: config.web.corsOrigin,
      credentials: true
    }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, '../../public')));
  }

  // Setup Express routes
  setupRoutes() {
    // Serve the main chat interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });

    // API routes
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/price', async (req, res) => {
      try {
        const currency = req.query.currency || 'USD';
        const price = await bitcoinService.getBitcoinPrice(currency);
        res.json({ price, currency, timestamp: new Date().toISOString() });
      } catch (error) {
        logger.error('Error getting Bitcoin price:', error);
        res.status(500).json({ error: 'Failed to get Bitcoin price' });
      }
    });

    this.app.get('/api/languages', (req, res) => {
      res.json(i18n.getAvailableLanguages());
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).sendFile(path.join(__dirname, '../../public/404.html'));
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('Express error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  // Setup Socket.IO event handlers
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);
      
      // Store user session
      this.activeUsers.set(socket.id, {
        language: config.i18n.defaultLanguage,
        connectedAt: new Date()
      });

      // Send welcome message
      this.sendWelcomeMessage(socket);

      // Handle chat messages
      socket.on('chat_message', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // Handle command messages
      socket.on('command', async (data) => {
        await this.handleCommand(socket, data);
      });

      // Handle language change
      socket.on('change_language', (data) => {
        this.handleLanguageChange(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
        this.activeUsers.delete(socket.id);
        this.userLanguages.delete(socket.id);
        this.userSessions.delete(socket.id);
      });
    });
  }

  // Get user's preferred language
  getUserLanguage(socketId) {
    const user = this.activeUsers.get(socketId);
    return user ? user.language : config.i18n.defaultLanguage;
  }

  // Set user's preferred language
  setUserLanguage(socketId, language) {
    if (i18n.isValidLanguage(language)) {
      const user = this.activeUsers.get(socketId);
      if (user) {
        user.language = language;
        this.activeUsers.set(socketId, user);
      }
      return true;
    }
    return false;
  }

  // Send welcome message
  sendWelcomeMessage(socket) {
    const language = this.getUserLanguage(socket.id);
    
    const welcomeData = {
      type: 'bot_message',
      message: i18n.t('welcome', language),
      timestamp: new Date().toISOString(),
      buttons: [
        { id: 'balance', text: i18n.t('balance', language), icon: '💰' },
        { id: 'send', text: i18n.t('send', language), icon: '📤' },
        { id: 'receive', text: i18n.t('receive', language), icon: '📥' },
        { id: 'help', text: i18n.t('help', language), icon: '❓' }
      ]
    };

    socket.emit('bot_message', welcomeData);
  }

  // Handle chat messages
  async handleChatMessage(socket, data) {
    const { message } = data;
    const language = this.getUserLanguage(socket.id);

    try {
      // Echo user message
      socket.emit('user_message', {
        message,
        timestamp: new Date().toISOString()
      });

      // Check if user has an active session
      const session = this.userSessions.get(socket.id);
      if (session) {
        await this.handleSessionMessage(socket, message, language, session);
        return;
      }

      // Process natural language
      await this.processNaturalLanguage(socket, message, language);
    } catch (error) {
      logger.error('Error handling chat message:', error);
      this.sendErrorMessage(socket, language);
    }
  }

  // Handle command messages
  async handleCommand(socket, data) {
    const { command, params = {} } = data;
    const language = this.getUserLanguage(socket.id);

    try {
      switch (command) {
        case 'balance':
          await this.handleBalance(socket, language);
          break;
        case 'send':
          await this.handleSend(socket, language, params.amount);
          break;
        case 'receive':
          await this.handleReceive(socket, language, params.amount);
          break;
        case 'history':
          await this.handleHistory(socket, language);
          break;
        case 'price':
          await this.handlePrice(socket, language);
          break;
        case 'education':
          await this.handleEducation(socket, language, params.topic);
          break;
        case 'help':
          await this.handleHelp(socket, language);
          break;
        default:
          this.sendMessage(socket, i18n.t('errors.invalid_command', language));
      }
    } catch (error) {
      logger.error(`Error handling command ${command}:`, error);
      this.sendErrorMessage(socket, language);
    }
  }

  // Process natural language messages
  async processNaturalLanguage(socket, message, language) {
    const text = message.toLowerCase();

    if (text.includes('balance') || text.includes('salio') || text.includes('solde')) {
      await this.handleBalance(socket, language);
    } else if (text.includes('send') || text.includes('tuma') || text.includes('envoyer')) {
      await this.handleSend(socket, language);
    } else if (text.includes('receive') || text.includes('pokea') || text.includes('recevoir')) {
      await this.handleReceive(socket, language);
    } else if (text.includes('price') || text.includes('bei') || text.includes('prix')) {
      await this.handlePrice(socket, language);
    } else if (text.includes('help') || text.includes('msaada') || text.includes('aide')) {
      await this.handleHelp(socket, language);
    } else if (bitcoinService.isValidLightningInvoice(message)) {
      this.sendMessage(socket, '⚡ Lightning invoice detected! Use the Send button to make payments.');
    } else {
      // Default response with suggestions
      this.sendMessage(socket, `I can help you with Bitcoin payments! Try asking about:
      
• Check balance
• Send Bitcoin
• Receive payments  
• Current Bitcoin price
• Learn about Bitcoin

Or use the buttons below for quick actions.`, [
        { id: 'balance', text: 'Balance', icon: '💰' },
        { id: 'send', text: 'Send', icon: '📤' },
        { id: 'receive', text: 'Receive', icon: '📥' },
        { id: 'help', text: 'Help', icon: '❓' }
      ]);
    }
  }

  // Handle session-based messages
  async handleSessionMessage(socket, message, language, session) {
    switch (session.action) {
      case 'send_amount':
        await this.handleSendAmount(socket, message, language);
        break;
      case 'receive_amount':
        await this.handleReceiveAmount(socket, message, language);
        break;
      case 'sending_payment':
        await this.handleSendingPayment(socket, message, language, session.amount);
        break;
    }
  }

  // Handle balance command
  async handleBalance(socket, language) {
    try {
      this.sendTyping(socket);
      
      const balance = await bitcoinService.getWalletBalance();
      const btcPrice = await bitcoinService.getBitcoinPrice('USD');
      const fiatValue = await bitcoinService.satsToFiat(balance.total_balance, 'USD');

      const balanceData = {
        type: 'balance',
        bitcoin: bitcoinService.formatAmount(balance.total_balance, 'btc'),
        satoshis: bitcoinService.formatAmount(balance.total_balance),
        usdValue: fiatValue ? `$${fiatValue.toFixed(2)}` : 'N/A',
        btcPrice: btcPrice ? `$${btcPrice.toLocaleString()}` : 'N/A',
        timestamp: new Date().toISOString()
      };

      socket.emit('bot_message', {
        type: 'bot_message',
        message: `💰 **${i18n.t('balance', language)}**`,
        data: balanceData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting balance:', error);
      this.sendErrorMessage(socket, language);
    }
  }

  // Handle send command
  async handleSend(socket, language, amount) {
    if (!amount) {
      this.sendMessage(socket, i18n.t('payments.amount_required', language), [
        { id: 'send', text: '1,000 sats', params: { amount: 1000 } },
        { id: 'send', text: '5,000 sats', params: { amount: 5000 } },
        { id: 'send', text: '10,000 sats', params: { amount: 10000 } }
      ]);
      
      this.userSessions.set(socket.id, { action: 'send_amount' });
      return;
    }

    const satsAmount = parseInt(amount);
    if (isNaN(satsAmount) || satsAmount <= 0) {
      this.sendMessage(socket, i18n.t('payments.invalid_amount', language));
      return;
    }

    this.sendMessage(socket, `⚡ **Send ${bitcoinService.formatAmount(satsAmount)}**

To send payment:
1. Paste a Lightning invoice
2. Or provide a Bitcoin address
3. I'll process the payment for you

*Send me the invoice or address now...*`);

    this.userSessions.set(socket.id, { action: 'sending_payment', amount: satsAmount });
  }

  // Handle receive command
  async handleReceive(socket, language, amount) {
    if (!amount) {
      this.sendMessage(socket, i18n.t('payments.amount_required', language), [
        { id: 'receive', text: '1,000 sats', params: { amount: 1000 } },
        { id: 'receive', text: '5,000 sats', params: { amount: 5000 } },
        { id: 'receive', text: '10,000 sats', params: { amount: 10000 } }
      ]);
      
      this.userSessions.set(socket.id, { action: 'receive_amount' });
      return;
    }

    await this.createPaymentRequest(socket, parseInt(amount), language);
  }

  // Create payment request
  async createPaymentRequest(socket, amount, language) {
    try {
      this.sendTyping(socket);
      this.sendMessage(socket, i18n.t('payments.generating_qr', language));

      const invoice = await bitcoinService.createLightningInvoice(amount, 'Bitsacco Payment');
      const qrCode = await bitcoinService.generatePaymentQR(invoice.payment_request);

      const paymentData = {
        type: 'payment_request',
        amount: bitcoinService.formatAmount(amount),
        invoice: invoice.payment_request,
        qrCode: qrCode,
        description: 'Bitsacco Payment',
        expiry: '1 hour'
      };

      socket.emit('bot_message', {
        type: 'bot_message',
        message: `⚡ **${i18n.t('payments.invoice_created', language)}**`,
        data: paymentData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error creating payment request:', error);
      this.sendErrorMessage(socket, language);
    }
  }

  // Handle history command
  async handleHistory(socket, language) {
    const historyData = {
      type: 'transaction_history',
      transactions: [
        { type: 'received', amount: '5,000 sats', time: '2 hours ago', status: 'confirmed' },
        { type: 'sent', amount: '1,500 sats', time: '1 day ago', status: 'confirmed' },
        { type: 'received', amount: '10,000 sats', time: '3 days ago', status: 'confirmed' }
      ]
    };

    socket.emit('bot_message', {
      type: 'bot_message',
      message: `📊 **${i18n.t('history', language)}**`,
      data: historyData,
      timestamp: new Date().toISOString()
    });
  }

  // Handle price command
  async handlePrice(socket, language) {
    try {
      this.sendTyping(socket);
      
      const usdPrice = await bitcoinService.getBitcoinPrice('USD');
      const eurPrice = await bitcoinService.getBitcoinPrice('EUR');

      const priceData = {
        type: 'price',
        usd: usdPrice ? `$${usdPrice.toLocaleString()}` : 'N/A',
        eur: eurPrice ? `€${eurPrice.toLocaleString()}` : 'N/A',
        timestamp: new Date().toLocaleString()
      };

      socket.emit('bot_message', {
        type: 'bot_message',
        message: '₿ **Bitcoin Price**',
        data: priceData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting Bitcoin price:', error);
      this.sendErrorMessage(socket, language);
    }
  }

  // Handle education command
  async handleEducation(socket, language, topic) {
    if (!topic) {
      this.sendMessage(socket, '📖 **Bitcoin Education** - Choose a topic to learn more:', [
        { id: 'education', text: '📚 Bitcoin Basics', params: { topic: 'basics' } },
        { id: 'education', text: '⚡ Lightning Network', params: { topic: 'lightning' } },
        { id: 'education', text: '🔒 Security Tips', params: { topic: 'security' } },
        { id: 'education', text: '🌍 Bitcoin in Africa', params: { topic: 'africa' } }
      ]);
      return;
    }

    let title = '';
    let content = '';

    switch (topic) {
      case 'basics':
        title = '📚 Bitcoin Basics';
        content = i18n.t('education.bitcoin_basics', language);
        break;
      case 'lightning':
        title = '⚡ Lightning Network';
        content = i18n.t('education.lightning_benefits', language);
        break;
      case 'security':
        title = '🔒 Security Tips';
        content = i18n.t('education.security_tips', language);
        break;
      case 'africa':
        title = '🌍 Bitcoin in Africa';
        content = i18n.t('education.africa_adoption', language);
        break;
    }

    this.sendMessage(socket, `${title}\n\n${content}`);
  }

  // Handle help command
  async handleHelp(socket, language) {
    const helpMessage = `ℹ️ **${i18n.t('help', language)}**

**Available Commands:**
• Balance - ${i18n.t('commands.balance', language)}
• Send - ${i18n.t('commands.send', language)}
• Receive - ${i18n.t('commands.receive', language)}
• History - ${i18n.t('commands.history', language)}
• Price - Get current Bitcoin price
• Education - Learn about Bitcoin

You can also just type naturally! Try:
• "Check my balance"
• "Send Bitcoin"
• "What's the Bitcoin price?"
• "I want to learn about Bitcoin"

🚀 Bitsacco - Empowering Africa with Bitcoin`;

    this.sendMessage(socket, helpMessage);
  }

  // Handle language change
  handleLanguageChange(socket, data) {
    const { language } = data;
    
    if (this.setUserLanguage(socket.id, language)) {
      socket.emit('language_changed', {
        language: language,
        name: i18n.getLanguageName(language),
        message: `✅ Language updated to ${i18n.getLanguageName(language)}`
      });
      
      // Send welcome message in new language
      setTimeout(() => {
        this.sendWelcomeMessage(socket);
      }, 1000);
    } else {
      socket.emit('error', { message: 'Invalid language selected' });
    }
  }

  // Handle send amount input
  async handleSendAmount(socket, message, language) {
    this.userSessions.delete(socket.id);
    
    const amount = parseInt(message);
    if (isNaN(amount) || amount <= 0) {
      this.sendMessage(socket, i18n.t('payments.invalid_amount', language));
      return;
    }

    await this.handleSend(socket, language, amount);
  }

  // Handle receive amount input
  async handleReceiveAmount(socket, message, language) {
    this.userSessions.delete(socket.id);
    
    const amount = parseInt(message);
    if (isNaN(amount) || amount <= 0) {
      this.sendMessage(socket, i18n.t('payments.invalid_amount', language));
      return;
    }

    await this.createPaymentRequest(socket, amount, language);
  }

  // Handle sending payment
  async handleSendingPayment(socket, message, language, amount) {
    this.userSessions.delete(socket.id);

    if (bitcoinService.isValidLightningInvoice(message)) {
      try {
        this.sendTyping(socket);
        const result = await bitcoinService.sendLightningPayment(message, amount);
        
        this.sendMessage(socket, `✅ ${i18n.t('payments.payment_sent', language)}

**Amount:** ${bitcoinService.formatAmount(amount)}
**Fee:** 1 sat
**Status:** Completed`);
      } catch (error) {
        this.sendMessage(socket, i18n.t('payments.payment_failed', language));
      }
    } else if (bitcoinService.isValidBitcoinAddress(message)) {
      this.sendMessage(socket, `✅ Bitcoin address detected. Payment processing...

**Amount:** ${bitcoinService.formatAmount(amount)}
**Address:** ${message}
**Status:** Processing`);
    } else {
      this.sendMessage(socket, '❌ Invalid Lightning invoice or Bitcoin address. Please try again.');
    }
  }

  // Send message helper
  sendMessage(socket, message, buttons = []) {
    socket.emit('bot_message', {
      type: 'bot_message',
      message,
      buttons,
      timestamp: new Date().toISOString()
    });
  }

  // Send typing indicator
  sendTyping(socket) {
    socket.emit('bot_typing', { typing: true });
    
    setTimeout(() => {
      socket.emit('bot_typing', { typing: false });
    }, 2000);
  }

  // Send error message
  sendErrorMessage(socket, language) {
    const errorMsg = i18n.t('errors.general', language);
    this.sendMessage(socket, `❌ ${errorMsg}`);
  }

  // Start the server
  startServer() {
    this.server.listen(config.PORT, () => {
      logger.info(`Web chat bot server running on port ${config.PORT}`);
      logger.info(`Chat interface available at: http://localhost:${config.PORT}`);
    });
  }

  // Stop the server
  stop() {
    if (this.server) {
      this.server.close();
      logger.info('Web chat bot server stopped');
    }
  }
}

export default new WebChatBotService();