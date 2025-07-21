import TelegramBot from 'node-telegram-bot-api';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import i18n from '../services/i18n.js';
import bitcoinService from '../services/bitcoin.js';

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.userLanguages = new Map(); // Store user language preferences
    this.userSessions = new Map(); // Store user session data
  }

  // Initialize Telegram bot
  initialize() {
    if (!config.bots.telegram.enabled) {
      logger.warn('Telegram bot is disabled - no token provided');
      return;
    }

    try {
      this.bot = new TelegramBot(config.bots.telegram.token, { polling: true });
      this.setupHandlers();
      logger.info('Telegram bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  // Setup message and command handlers
  setupHandlers() {
    // Command handlers
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/help/, this.handleHelp.bind(this));
    this.bot.onText(/\/balance/, this.handleBalance.bind(this));
    this.bot.onText(/\/send(?:\s+(.+))?/, this.handleSend.bind(this));
    this.bot.onText(/\/receive(?:\s+(.+))?/, this.handleReceive.bind(this));
    this.bot.onText(/\/history/, this.handleHistory.bind(this));
    this.bot.onText(/\/language/, this.handleLanguage.bind(this));
    this.bot.onText(/\/price/, this.handlePrice.bind(this));
    this.bot.onText(/\/education/, this.handleEducation.bind(this));

    // Callback query handler for inline keyboards
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

    // Error handler
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error:', error);
    });

    logger.info('Telegram bot handlers setup complete');
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

  // Handle /start command
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const language = this.getUserLanguage(userId);

    try {
      const welcomeMessage = i18n.t('welcome', language);
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: i18n.t('balance', language), callback_data: 'balance' },
              { text: i18n.t('receive', language), callback_data: 'receive' }
            ],
            [
              { text: i18n.t('send', language), callback_data: 'send' },
              { text: i18n.t('history', language), callback_data: 'history' }
            ],
            [
              { text: i18n.t('settings', language), callback_data: 'settings' },
              { text: i18n.t('support', language), callback_data: 'support' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId, welcomeMessage, keyboard);
      logger.info(`User ${userId} started the bot`);
    } catch (error) {
      logger.error('Error handling start command:', error);
      await this.sendErrorMessage(chatId, language);
    }
  }

  // Handle /help command
  async handleHelp(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const language = this.getUserLanguage(userId);

    const helpText = `
${i18n.t('help', language)}

/start - ${i18n.t('commands.start', language)}
/help - ${i18n.t('commands.help', language)}
/balance - ${i18n.t('commands.balance', language)}
/send - ${i18n.t('commands.send', language)}
/receive - ${i18n.t('commands.receive', language)}
/history - ${i18n.t('commands.history', language)}
/language - ${i18n.t('commands.language', language)}
/price - Get current Bitcoin price
/education - Learn about Bitcoin

🚀 Bitsacco - Empowering Africa with Bitcoin
    `;

    await this.bot.sendMessage(chatId, helpText);
  }

  // Handle /balance command
  async handleBalance(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const language = this.getUserLanguage(userId);

    try {
      const balance = await bitcoinService.getWalletBalance();
      const btcPrice = await bitcoinService.getBitcoinPrice('USD');
      const fiatValue = await bitcoinService.satsToFiat(balance.total_balance, 'USD');

      const balanceText = `
💰 **${i18n.t('balance', language)}**

**Bitcoin:** ${bitcoinService.formatAmount(balance.total_balance, 'btc')}
**Satoshis:** ${bitcoinService.formatAmount(balance.total_balance)}
**USD Value:** $${fiatValue ? fiatValue.toFixed(2) : 'N/A'}

**BTC Price:** $${btcPrice ? btcPrice.toLocaleString() : 'N/A'}
      `;

      await this.bot.sendMessage(chatId, balanceText, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error getting balance:', error);
      await this.sendErrorMessage(chatId, language);
    }
  }

  // Handle /send command
  async handleSend(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const language = this.getUserLanguage(userId);
    const amount = match[1];

    if (!amount) {
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1,000 sats', callback_data: 'send_1000' },
              { text: '5,000 sats', callback_data: 'send_5000' }
            ],
            [
              { text: '10,000 sats', callback_data: 'send_10000' },
              { text: '50,000 sats', callback_data: 'send_50000' }
            ],
            [
              { text: 'Custom Amount', callback_data: 'send_custom' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(
        chatId, 
        i18n.t('payments.amount_required', language), 
        keyboard
      );
      return;
    }

    try {
      const satsAmount = parseInt(amount);
      if (isNaN(satsAmount) || satsAmount <= 0) {
        await this.bot.sendMessage(chatId, i18n.t('payments.invalid_amount', language));
        return;
      }

      // For demo, we'll show how to pay an invoice
      const sendInstructions = `
⚡ **Send ${bitcoinService.formatAmount(satsAmount)}**

To send payment:
1. Paste a Lightning invoice
2. Or provide a Bitcoin address
3. I'll process the payment for you

*Send me the invoice or address now...*
      `;

      await this.bot.sendMessage(chatId, sendInstructions, { parse_mode: 'Markdown' });
      
      // Store session data for next message
      this.userSessions.set(userId, { action: 'sending', amount: satsAmount });
    } catch (error) {
      logger.error('Error handling send command:', error);
      await this.sendErrorMessage(chatId, language);
    }
  }

  // Handle /receive command
  async handleReceive(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const language = this.getUserLanguage(userId);
    const amount = match[1];

    if (!amount) {
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1,000 sats', callback_data: 'receive_1000' },
              { text: '5,000 sats', callback_data: 'receive_5000' }
            ],
            [
              { text: '10,000 sats', callback_data: 'receive_10000' },
              { text: '50,000 sats', callback_data: 'receive_50000' }
            ],
            [
              { text: 'Custom Amount', callback_data: 'receive_custom' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(
        chatId, 
        i18n.t('payments.amount_required', language), 
        keyboard
      );
      return;
    }

    await this.createPaymentRequest(chatId, parseInt(amount), language);
  }

  // Create payment request
  async createPaymentRequest(chatId, amount, language) {
    try {
      await this.bot.sendMessage(chatId, i18n.t('payments.generating_qr', language));

      const invoice = await bitcoinService.createLightningInvoice(amount, 'Bitsacco Payment');
      const qrCode = await bitcoinService.generatePaymentQR(invoice.payment_request);

      // Convert base64 QR code to buffer for Telegram
      const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');

      const paymentText = `
⚡ **${i18n.t('payments.invoice_created', language)}**

**Amount:** ${bitcoinService.formatAmount(amount)}
**Description:** Bitsacco Payment

${i18n.t('payments.scan_qr', language)}

\`${invoice.payment_request}\`
      `;

      await this.bot.sendPhoto(chatId, qrBuffer, { 
        caption: paymentText, 
        parse_mode: 'Markdown' 
      });
    } catch (error) {
      logger.error('Error creating payment request:', error);
      await this.sendErrorMessage(chatId, language);
    }
  }

  // Handle /history command
  async handleHistory(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const language = this.getUserLanguage(userId);

    // Mock transaction history
    const historyText = `
📊 **${i18n.t('history', language)}**

**Recent Transactions:**

🟢 **Received** - 5,000 sats
*2 hours ago*

🔴 **Sent** - 1,500 sats  
*1 day ago*

🟢 **Received** - 10,000 sats
*3 days ago*

💡 *Full transaction history available in web dashboard*
    `;

    await this.bot.sendMessage(chatId, historyText, { parse_mode: 'Markdown' });
  }

  // Handle /language command
  async handleLanguage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const languages = i18n.getAvailableLanguages();
    const keyboard = {
      reply_markup: {
        inline_keyboard: languages.map(lang => [
          { text: `${lang.name} (${lang.code.toUpperCase()})`, callback_data: `lang_${lang.code}` }
        ])
      }
    };

    await this.bot.sendMessage(chatId, 'Choose your language / Chagua lugha yako / Choisissez votre langue:', keyboard);
  }

  // Handle /price command
  async handlePrice(msg) {
    const chatId = msg.chat.id;
    const language = this.getUserLanguage(msg.from.id);

    try {
      const usdPrice = await bitcoinService.getBitcoinPrice('USD');
      const eurPrice = await bitcoinService.getBitcoinPrice('EUR');

      const priceText = `
₿ **Bitcoin Price**

**USD:** $${usdPrice ? usdPrice.toLocaleString() : 'N/A'}
**EUR:** €${eurPrice ? eurPrice.toLocaleString() : 'N/A'}

*Updated: ${new Date().toLocaleString()}*
      `;

      await this.bot.sendMessage(chatId, priceText, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error getting Bitcoin price:', error);
      await this.sendErrorMessage(chatId, language);
    }
  }

  // Handle /education command
  async handleEducation(msg) {
    const chatId = msg.chat.id;
    const language = this.getUserLanguage(msg.from.id);

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📚 Bitcoin Basics', callback_data: 'edu_basics' },
            { text: '⚡ Lightning Network', callback_data: 'edu_lightning' }
          ],
          [
            { text: '🔒 Security Tips', callback_data: 'edu_security' },
            { text: '🌍 Bitcoin in Africa', callback_data: 'edu_africa' }
          ]
        ]
      }
    };

    await this.bot.sendMessage(
      chatId, 
      '📖 **Bitcoin Education** - Choose a topic to learn more:', 
      { ...keyboard, parse_mode: 'Markdown' }
    );
  }

  // Handle callback queries (inline keyboard buttons)
  async handleCallbackQuery(callbackQuery) {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const language = this.getUserLanguage(userId);

    try {
      // Answer callback query to remove loading state
      await this.bot.answerCallbackQuery(callbackQuery.id);

      if (data.startsWith('lang_')) {
        const selectedLang = data.replace('lang_', '');
        this.setUserLanguage(userId, selectedLang);
        await this.bot.sendMessage(
          chatId, 
          `✅ Language updated to ${i18n.getLanguageName(selectedLang)}`
        );
      } else if (data.startsWith('send_')) {
        if (data === 'send_custom') {
          await this.bot.sendMessage(chatId, 'Please enter the amount in satoshis:');
          this.userSessions.set(userId, { action: 'send_custom_amount' });
        } else {
          const amount = parseInt(data.replace('send_', ''));
          await this.bot.sendMessage(
            chatId, 
            `⚡ Ready to send ${bitcoinService.formatAmount(amount)}\n\nPlease paste a Lightning invoice or Bitcoin address:`
          );
          this.userSessions.set(userId, { action: 'sending', amount });
        }
      } else if (data.startsWith('receive_')) {
        if (data === 'receive_custom') {
          await this.bot.sendMessage(chatId, 'Please enter the amount in satoshis:');
          this.userSessions.set(userId, { action: 'receive_custom_amount' });
        } else {
          const amount = parseInt(data.replace('receive_', ''));
          await this.createPaymentRequest(chatId, amount, language);
        }
      } else if (data.startsWith('edu_')) {
        await this.handleEducationTopic(chatId, data.replace('edu_', ''), language);
      } else {
        // Handle other button presses
        switch (data) {
          case 'balance':
            await this.handleBalance({ chat: { id: chatId }, from: { id: userId } });
            break;
          case 'send':
            await this.handleSend({ chat: { id: chatId }, from: { id: userId } }, [null, null]);
            break;
          case 'receive':
            await this.handleReceive({ chat: { id: chatId }, from: { id: userId } }, [null, null]);
            break;
          case 'history':
            await this.handleHistory({ chat: { id: chatId }, from: { id: userId } });
            break;
          case 'settings':
            await this.handleLanguage({ chat: { id: chatId }, from: { id: userId } });
            break;
          case 'support':
            await this.bot.sendMessage(
              chatId, 
              '🆘 **Support**\n\nFor help, contact us:\n📧 support@bitsacco.com\n💬 Telegram: @BitsaccoSupport',
              { parse_mode: 'Markdown' }
            );
            break;
        }
      }
    } catch (error) {
      logger.error('Error handling callback query:', error);
      await this.sendErrorMessage(chatId, language);
    }
  }

  // Handle education topics
  async handleEducationTopic(chatId, topic, language) {
    let content = '';

    switch (topic) {
      case 'basics':
        content = `📚 **Bitcoin Basics**\n\n${i18n.t('education.bitcoin_basics', language)}`;
        break;
      case 'lightning':
        content = `⚡ **Lightning Network**\n\n${i18n.t('education.lightning_benefits', language)}`;
        break;
      case 'security':
        content = `🔒 **Security**\n\n${i18n.t('education.security_tips', language)}`;
        break;
      case 'africa':
        content = `🌍 **Bitcoin in Africa**\n\n${i18n.t('education.africa_adoption', language)}`;
        break;
    }

    await this.bot.sendMessage(chatId, content, { parse_mode: 'Markdown' });
  }

  // Send error message
  async sendErrorMessage(chatId, language) {
    const errorMsg = i18n.t('errors.general', language);
    await this.bot.sendMessage(chatId, `❌ ${errorMsg}`);
  }

  // Stop the bot
  stop() {
    if (this.bot) {
      this.bot.stopPolling();
      logger.info('Telegram bot stopped');
    }
  }
}

export default new TelegramBotService();