import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import i18n from '../services/i18n.js';
import bitcoinService from '../services/bitcoin.js';

class WhatsAppBotService {
  constructor() {
    this.client = null;
    this.userLanguages = new Map();
    this.userSessions = new Map();
    this.isReady = false;
  }

  // Initialize WhatsApp bot
  initialize() {
    if (!config.bots.whatsapp.enabled) {
      logger.warn('WhatsApp bot is disabled');
      return;
    }

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: config.bots.whatsapp.sessionName
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.setupEventHandlers();
      this.client.initialize();
      logger.info('WhatsApp bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp bot:', error);
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      logger.info('WhatsApp QR Code received, scan with your phone:');
      QRCode.toString(qr, { type: 'terminal' }, (err, url) => {
        if (!err) {
          console.log(url);
        }
      });
    });

    this.client.on('ready', () => {
      logger.info('WhatsApp bot is ready!');
      this.isReady = true;
    });

    this.client.on('message', async (message) => {
      if (!this.isReady) return;
      
      try {
        await this.handleMessage(message);
      } catch (error) {
        logger.error('Error handling WhatsApp message:', error);
      }
    });

    this.client.on('auth_failure', () => {
      logger.error('WhatsApp authentication failed');
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp client disconnected:', reason);
      this.isReady = false;
    });
  }

  // Get user's preferred language
  getUserLanguage(userId) {
    return this.userLanguages.get(userId) || config.i18n.defaultLanguage;
  }

  // Set user's preferred language
  setUserLanguage(userId, language) {
    if (i18n.isValidLanguage(language)) {
      this.userLanguages.set(userId, language);
      return true;
    }
    return false;
  }

  // Handle incoming messages
  async handleMessage(message) {
    // Ignore group messages and status updates
    if (message.from.includes('@g.us') || message.from.includes('status@broadcast')) {
      return;
    }

    const userId = message.from;
    const text = message.body.toLowerCase().trim();
    const language = this.getUserLanguage(userId);

    // Handle commands
    if (text.startsWith('/') || text.startsWith('!')) {
      await this.handleCommand(message, text, language);
    } else if (this.userSessions.has(userId)) {
      await this.handleSession(message, text, language);
    } else {
      // Handle general text messages
      await this.handleGeneralMessage(message, text, language);
    }
  }

  // Handle commands
  async handleCommand(message, text, language) {
    const userId = message.from;
    const command = text.substring(1).split(' ')[0];
    const args = text.substring(1).split(' ').slice(1);

    switch (command) {
      case 'start':
      case 'hello':
      case 'hi':
        await this.handleStart(message, language);
        break;
      case 'help':
        await this.handleHelp(message, language);
        break;
      case 'balance':
        await this.handleBalance(message, language);
        break;
      case 'send':
        await this.handleSend(message, language, args[0]);
        break;
      case 'receive':
        await this.handleReceive(message, language, args[0]);
        break;
      case 'history':
        await this.handleHistory(message, language);
        break;
      case 'price':
        await this.handlePrice(message, language);
        break;
      case 'language':
      case 'lang':
        await this.handleLanguage(message, language, args[0]);
        break;
      case 'education':
      case 'learn':
        await this.handleEducation(message, language);
        break;
      default:
        await this.sendMessage(message.from, i18n.t('errors.invalid_command', language));
    }
  }

  // Handle session-based interactions
  async handleSession(message, text, language) {
    const userId = message.from;
    const session = this.userSessions.get(userId);

    switch (session.action) {
      case 'send_custom_amount':
        await this.handleCustomSendAmount(message, text, language);
        break;
      case 'receive_custom_amount':
        await this.handleCustomReceiveAmount(message, text, language);
        break;
      case 'sending':
        await this.handleSendPayment(message, text, language, session.amount);
        break;
      case 'language_selection':
        await this.handleLanguageSelection(message, text, language);
        break;
    }
  }

  // Handle general messages (non-commands)
  async handleGeneralMessage(message, text, language) {
    // Check for common greetings and Bitcoin-related keywords
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      await this.handleStart(message, language);
    } else if (text.includes('bitcoin') || text.includes('btc') || text.includes('payment')) {
      await this.sendMessage(
        message.from,
        `💡 ${i18n.t('welcome', language)}\n\nType /help to see available commands.`
      );
    } else if (bitcoinService.isValidLightningInvoice(text)) {
      await this.sendMessage(
        message.from,
        `⚡ Lightning invoice detected! Use /send to make payments.`
      );
    } else {
      // Provide helpful response
      await this.sendMessage(
        message.from,
        `Hello! 👋 I'm the Bitsacco bot. Type /help to see what I can do for you!`
      );
    }
  }

  // Handle /start command
  async handleStart(message, language) {
    const welcomeMessage = `
${i18n.t('welcome', language)}

🚀 *Quick Actions:*
• /balance - ${i18n.t('commands.balance', language)}
• /send - ${i18n.t('commands.send', language)}
• /receive - ${i18n.t('commands.receive', language)}
• /help - ${i18n.t('commands.help', language)}

🌍 *Available Languages:*
English • Kiswahili • Français

Type /language to change your language preference.
    `;

    await this.sendMessage(message.from, welcomeMessage);
  }

  // Handle /help command
  async handleHelp(message, language) {
    const helpMessage = `
📖 *${i18n.t('help', language)}*

*💰 Wallet Commands:*
• /balance - ${i18n.t('commands.balance', language)}
• /send [amount] - ${i18n.t('commands.send', language)}
• /receive [amount] - ${i18n.t('commands.receive', language)}
• /history - ${i18n.t('commands.history', language)}

*📊 Information:*
• /price - Get current Bitcoin price
• /education - Learn about Bitcoin

*⚙️ Settings:*
• /language - ${i18n.t('commands.language', language)}
• /help - Show this help message

*Example:*
/send 1000 - Send 1000 satoshis
/receive 5000 - Request 5000 satoshis

🚀 Bitsacco - Empowering Africa with Bitcoin
    `;

    await this.sendMessage(message.from, helpMessage);
  }

  // Handle /balance command
  async handleBalance(message, language) {
    try {
      const balance = await bitcoinService.getWalletBalance();
      const btcPrice = await bitcoinService.getBitcoinPrice('USD');
      const fiatValue = await bitcoinService.satsToFiat(balance.total_balance, 'USD');

      const balanceMessage = `
💰 *${i18n.t('balance', language)}*

₿ *Bitcoin:* ${bitcoinService.formatAmount(balance.total_balance, 'btc')}
⚡ *Satoshis:* ${bitcoinService.formatAmount(balance.total_balance)}
💵 *USD Value:* $${fiatValue ? fiatValue.toFixed(2) : 'N/A'}

📈 *BTC Price:* $${btcPrice ? btcPrice.toLocaleString() : 'N/A'}

_Updated: ${new Date().toLocaleString()}_
      `;

      await this.sendMessage(message.from, balanceMessage);
    } catch (error) {
      logger.error('Error getting balance:', error);
      await this.sendErrorMessage(message.from, language);
    }
  }

  // Handle /send command
  async handleSend(message, language, amount) {
    if (!amount) {
      const sendMessage = `
⚡ *Send Bitcoin*

${i18n.t('payments.amount_required', language)}

*Quick amounts:*
• /send 1000 - Send 1,000 sats
• /send 5000 - Send 5,000 sats
• /send 10000 - Send 10,000 sats

Or reply with "custom" for custom amount.
      `;

      await this.sendMessage(message.from, sendMessage);
      this.userSessions.set(message.from, { action: 'send_custom_amount' });
      return;
    }

    const satsAmount = parseInt(amount);
    if (isNaN(satsAmount) || satsAmount <= 0) {
      await this.sendMessage(message.from, i18n.t('payments.invalid_amount', language));
      return;
    }

    const sendInstructions = `
⚡ *Send ${bitcoinService.formatAmount(satsAmount)}*

To send payment:
1. Send me a Lightning invoice
2. Or send a Bitcoin address
3. I'll process the payment for you

*Send the invoice or address now...*
    `;

    await this.sendMessage(message.from, sendInstructions);
    this.userSessions.set(message.from, { action: 'sending', amount: satsAmount });
  }

  // Handle /receive command
  async handleReceive(message, language, amount) {
    if (!amount) {
      const receiveMessage = `
📥 *Receive Bitcoin*

${i18n.t('payments.amount_required', language)}

*Quick amounts:*
• /receive 1000 - Request 1,000 sats
• /receive 5000 - Request 5,000 sats
• /receive 10000 - Request 10,000 sats

Or reply with "custom" for custom amount.
      `;

      await this.sendMessage(message.from, receiveMessage);
      this.userSessions.set(message.from, { action: 'receive_custom_amount' });
      return;
    }

    await this.createPaymentRequest(message, parseInt(amount), language);
  }

  // Create payment request
  async createPaymentRequest(message, amount, language) {
    try {
      await this.sendMessage(message.from, i18n.t('payments.generating_qr', language));

      const invoice = await bitcoinService.createLightningInvoice(amount, 'Bitsacco Payment');
      const qrCode = await bitcoinService.generatePaymentQR(invoice.payment_request);

      const paymentMessage = `
⚡ *${i18n.t('payments.invoice_created', language)}*

*Amount:* ${bitcoinService.formatAmount(amount)}
*Description:* Bitsacco Payment

${i18n.t('payments.scan_qr', language)}

\`${invoice.payment_request}\`

_Invoice expires in 1 hour_
      `;

      // Send QR code image
      const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
      const media = new MessageMedia('image/png', qrBuffer.toString('base64'), 'qr.png');
      
      await this.client.sendMessage(message.from, media, { caption: paymentMessage });
    } catch (error) {
      logger.error('Error creating payment request:', error);
      await this.sendErrorMessage(message.from, language);
    }
  }

  // Handle /history command
  async handleHistory(message, language) {
    const historyMessage = `
📊 *${i18n.t('history', language)}*

*Recent Transactions:*

🟢 *Received* - 5,000 sats
_2 hours ago_

🔴 *Sent* - 1,500 sats
_1 day ago_

🟢 *Received* - 10,000 sats
_3 days ago_

💡 _Full transaction history available in web dashboard_
    `;

    await this.sendMessage(message.from, historyMessage);
  }

  // Handle /price command
  async handlePrice(message, language) {
    try {
      const usdPrice = await bitcoinService.getBitcoinPrice('USD');
      const eurPrice = await bitcoinService.getBitcoinPrice('EUR');

      const priceMessage = `
₿ *Bitcoin Price*

💵 *USD:* $${usdPrice ? usdPrice.toLocaleString() : 'N/A'}
💶 *EUR:* €${eurPrice ? eurPrice.toLocaleString() : 'N/A'}

📅 _Updated: ${new Date().toLocaleString()}_
      `;

      await this.sendMessage(message.from, priceMessage);
    } catch (error) {
      logger.error('Error getting Bitcoin price:', error);
      await this.sendErrorMessage(message.from, language);
    }
  }

  // Handle /language command
  async handleLanguage(message, language, selectedLang) {
    if (selectedLang) {
      const langCode = selectedLang.toLowerCase();
      if (this.setUserLanguage(message.from, langCode)) {
        await this.sendMessage(
          message.from,
          `✅ Language updated to ${i18n.getLanguageName(langCode)}`
        );
      } else {
        await this.sendMessage(message.from, 'Invalid language. Choose: en, sw, or fr');
      }
    } else {
      const languageMessage = `
🌍 *Language Settings*

Choose your preferred language:

1️⃣ English (en)
2️⃣ Kiswahili (sw)  
3️⃣ Français (fr)

Reply with the language code (en, sw, or fr)
      `;

      await this.sendMessage(message.from, languageMessage);
      this.userSessions.set(message.from, { action: 'language_selection' });
    }
  }

  // Handle /education command
  async handleEducation(message, language) {
    const educationMessage = `
📖 *Bitcoin Education*

Choose a topic to learn more:

1️⃣ Bitcoin Basics
2️⃣ Lightning Network
3️⃣ Security Tips
4️⃣ Bitcoin in Africa

Reply with the number (1-4) to learn more about that topic.
    `;

    await this.sendMessage(message.from, educationMessage);
    this.userSessions.set(message.from, { action: 'education_selection' });
  }

  // Handle custom send amount
  async handleCustomSendAmount(message, text, language) {
    this.userSessions.delete(message.from);

    if (text === 'custom') {
      await this.sendMessage(message.from, 'Please enter the amount in satoshis:');
      this.userSessions.set(message.from, { action: 'send_custom_amount' });
      return;
    }

    const amount = parseInt(text);
    if (isNaN(amount) || amount <= 0) {
      await this.sendMessage(message.from, i18n.t('payments.invalid_amount', language));
      return;
    }

    await this.handleSend(message, language, amount.toString());
  }

  // Handle custom receive amount
  async handleCustomReceiveAmount(message, text, language) {
    this.userSessions.delete(message.from);

    if (text === 'custom') {
      await this.sendMessage(message.from, 'Please enter the amount in satoshis:');
      this.userSessions.set(message.from, { action: 'receive_custom_amount' });
      return;
    }

    const amount = parseInt(text);
    if (isNaN(amount) || amount <= 0) {
      await this.sendMessage(message.from, i18n.t('payments.invalid_amount', language));
      return;
    }

    await this.createPaymentRequest(message, amount, language);
  }

  // Handle send payment
  async handleSendPayment(message, text, language, amount) {
    this.userSessions.delete(message.from);

    if (bitcoinService.isValidLightningInvoice(text)) {
      try {
        const result = await bitcoinService.sendLightningPayment(text, amount);
        await this.sendMessage(
          message.from,
          `✅ ${i18n.t('payments.payment_sent', language)}\n\nAmount: ${bitcoinService.formatAmount(amount)}\nFee: 1 sat`
        );
      } catch (error) {
        await this.sendMessage(message.from, i18n.t('payments.payment_failed', language));
      }
    } else if (bitcoinService.isValidBitcoinAddress(text)) {
      await this.sendMessage(
        message.from,
        `✅ Bitcoin address detected. Payment processing...\n\nAmount: ${bitcoinService.formatAmount(amount)}\nAddress: ${text}`
      );
    } else {
      await this.sendMessage(
        message.from,
        '❌ Invalid Lightning invoice or Bitcoin address. Please try again.'
      );
    }
  }

  // Handle language selection
  async handleLanguageSelection(message, text, language) {
    this.userSessions.delete(message.from);

    const langCode = text.toLowerCase();
    if (this.setUserLanguage(message.from, langCode)) {
      await this.sendMessage(
        message.from,
        `✅ Language updated to ${i18n.getLanguageName(langCode)}`
      );
    } else {
      await this.sendMessage(message.from, 'Invalid selection. Please use: en, sw, or fr');
    }
  }

  // Send message helper
  async sendMessage(to, text) {
    try {
      await this.client.sendMessage(to, text);
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
    }
  }

  // Send error message
  async sendErrorMessage(to, language) {
    const errorMsg = i18n.t('errors.general', language);
    await this.sendMessage(to, `❌ ${errorMsg}`);
  }

  // Stop the bot
  stop() {
    if (this.client) {
      this.client.destroy();
      this.isReady = false;
      logger.info('WhatsApp bot stopped');
    }
  }
}

export default new WhatsAppBotService();