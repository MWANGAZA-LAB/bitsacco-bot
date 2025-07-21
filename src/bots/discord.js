import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import i18n from '../services/i18n.js';
import bitcoinService from '../services/bitcoin.js';

class DiscordBotService {
  constructor() {
    this.client = null;
    this.rest = null;
    this.userLanguages = new Map();
    this.userSessions = new Map();
    this.commands = [];
  }

  // Initialize Discord bot
  initialize() {
    if (!config.bots.discord.enabled) {
      logger.warn('Discord bot is disabled - no token provided');
      return;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages
        ]
      });

      this.rest = new REST({ version: '10' }).setToken(config.bots.discord.token);
      this.setupCommands();
      this.setupEventHandlers();
      
      this.client.login(config.bots.discord.token);
      logger.info('Discord bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Discord bot:', error);
    }
  }

  // Setup slash commands
  setupCommands() {
    this.commands = [
      {
        name: 'start',
        description: 'Start using Bitsacco bot'
      },
      {
        name: 'balance',
        description: 'Check your Bitcoin balance'
      },
      {
        name: 'send',
        description: 'Send Bitcoin/Lightning payment',
        options: [
          {
            name: 'amount',
            description: 'Amount in satoshis',
            type: 4, // INTEGER
            required: false
          }
        ]
      },
      {
        name: 'receive',
        description: 'Generate payment request',
        options: [
          {
            name: 'amount',
            description: 'Amount in satoshis',
            type: 4, // INTEGER
            required: false
          }
        ]
      },
      {
        name: 'history',
        description: 'View transaction history'
      },
      {
        name: 'price',
        description: 'Get current Bitcoin price'
      },
      {
        name: 'language',
        description: 'Change your language preference',
        options: [
          {
            name: 'lang',
            description: 'Choose language',
            type: 3, // STRING
            required: false,
            choices: [
              { name: 'English', value: 'en' },
              { name: 'Kiswahili', value: 'sw' },
              { name: 'Français', value: 'fr' }
            ]
          }
        ]
      },
      {
        name: 'education',
        description: 'Learn about Bitcoin and Lightning'
      },
      {
        name: 'help',
        description: 'Get help and see available commands'
      }
    ];
  }

  // Setup event handlers
  setupEventHandlers() {
    this.client.once('ready', async () => {
      logger.info(`Discord bot logged in as ${this.client.user.tag}`);
      
      try {
        // Register slash commands
        await this.rest.put(
          Routes.applicationCommands(this.client.user.id),
          { body: this.commands }
        );
        logger.info('Discord slash commands registered');
      } catch (error) {
        logger.error('Failed to register Discord commands:', error);
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      }
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
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

  // Handle slash commands
  async handleSlashCommand(interaction) {
    const { commandName, user, options } = interaction;
    const userId = user.id;
    const language = this.getUserLanguage(userId);

    try {
      switch (commandName) {
        case 'start':
          await this.handleStart(interaction, language);
          break;
        case 'balance':
          await this.handleBalance(interaction, language);
          break;
        case 'send':
          await this.handleSend(interaction, language, options.getInteger('amount'));
          break;
        case 'receive':
          await this.handleReceive(interaction, language, options.getInteger('amount'));
          break;
        case 'history':
          await this.handleHistory(interaction, language);
          break;
        case 'price':
          await this.handlePrice(interaction, language);
          break;
        case 'language':
          await this.handleLanguage(interaction, options.getString('lang'));
          break;
        case 'education':
          await this.handleEducation(interaction, language);
          break;
        case 'help':
          await this.handleHelp(interaction, language);
          break;
        default:
          await interaction.reply({ content: 'Unknown command!', ephemeral: true });
      }
    } catch (error) {
      logger.error(`Error handling Discord command ${commandName}:`, error);
      await this.sendErrorMessage(interaction, language);
    }
  }

  // Handle /start command
  async handleStart(interaction, language) {
    const embed = new EmbedBuilder()
      .setColor(0xF7931A) // Bitcoin orange
      .setTitle('🚀 Bitsacco')
      .setDescription(i18n.t('welcome', language))
      .setThumbnail('https://bitcoin.org/img/icons/logotop.svg')
      .addFields(
        { name: '⚡ Lightning Fast', value: 'Instant Bitcoin payments', inline: true },
        { name: '🌍 Africa Focused', value: 'Built for African communities', inline: true },
        { name: '📚 Educational', value: 'Learn while you earn', inline: true }
      )
      .setFooter({ text: 'Use /help to see all commands' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('balance')
          .setLabel(i18n.t('balance', language))
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💰'),
        new ButtonBuilder()
          .setCustomId('receive')
          .setLabel(i18n.t('receive', language))
          .setStyle(ButtonStyle.Success)
          .setEmoji('📥'),
        new ButtonBuilder()
          .setCustomId('send')
          .setLabel(i18n.t('send', language))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📤')
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // Handle /balance command
  async handleBalance(interaction, language) {
    await interaction.deferReply();

    try {
      const balance = await bitcoinService.getWalletBalance();
      const btcPrice = await bitcoinService.getBitcoinPrice('USD');
      const fiatValue = await bitcoinService.satsToFiat(balance.total_balance, 'USD');

      const embed = new EmbedBuilder()
        .setColor(0x00D924) // Green
        .setTitle(`💰 ${i18n.t('balance', language)}`)
        .addFields(
          { name: '₿ Bitcoin', value: bitcoinService.formatAmount(balance.total_balance, 'btc'), inline: true },
          { name: '⚡ Satoshis', value: bitcoinService.formatAmount(balance.total_balance), inline: true },
          { name: '💵 USD Value', value: `$${fiatValue ? fiatValue.toFixed(2) : 'N/A'}`, inline: true },
          { name: '📈 BTC Price', value: `$${btcPrice ? btcPrice.toLocaleString() : 'N/A'}`, inline: false }
        )
        .setFooter({ text: `Updated: ${new Date().toLocaleString()}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error getting balance:', error);
      await this.sendErrorMessage(interaction, language);
    }
  }

  // Handle /send command
  async handleSend(interaction, language, amount) {
    if (!amount) {
      const embed = new EmbedBuilder()
        .setColor(0xFFA500) // Orange
        .setTitle('⚡ Send Bitcoin')
        .setDescription(i18n.t('payments.amount_required', language));

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('send_1000')
            .setLabel('1,000 sats')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('send_5000')
            .setLabel('5,000 sats')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('send_10000')
            .setLabel('10,000 sats')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(`⚡ Send ${bitcoinService.formatAmount(amount)}`)
      .setDescription('To send payment:\n1. Paste a Lightning invoice\n2. Or provide a Bitcoin address\n3. I\'ll process the payment for you')
      .addFields(
        { name: 'Amount', value: bitcoinService.formatAmount(amount), inline: true },
        { name: 'Status', value: 'Waiting for invoice/address', inline: true }
      );

    await interaction.reply({ embeds: [embed] });
    
    // Store session data
    this.userSessions.set(interaction.user.id, { action: 'sending', amount });
  }

  // Handle /receive command
  async handleReceive(interaction, language, amount) {
    if (!amount) {
      const embed = new EmbedBuilder()
        .setColor(0x00D924)
        .setTitle('📥 Receive Bitcoin')
        .setDescription(i18n.t('payments.amount_required', language));

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('receive_1000')
            .setLabel('1,000 sats')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('receive_5000')
            .setLabel('5,000 sats')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('receive_10000')
            .setLabel('10,000 sats')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    await this.createPaymentRequest(interaction, amount, language);
  }

  // Create payment request
  async createPaymentRequest(interaction, amount, language) {
    await interaction.deferReply();

    try {
      const invoice = await bitcoinService.createLightningInvoice(amount, 'Bitsacco Payment');
      const qrCode = await bitcoinService.generatePaymentQR(invoice.payment_request);

      const embed = new EmbedBuilder()
        .setColor(0x00D924)
        .setTitle('⚡ Lightning Invoice Created!')
        .setDescription(i18n.t('payments.scan_qr', language))
        .addFields(
          { name: 'Amount', value: bitcoinService.formatAmount(amount), inline: true },
          { name: 'Description', value: 'Bitsacco Payment', inline: true },
          { name: 'Invoice', value: `\`\`\`${invoice.payment_request}\`\`\``, inline: false }
        )
        .setImage('attachment://qr.png')
        .setFooter({ text: 'Invoice expires in 1 hour' });

      // Convert base64 QR code to buffer
      const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');

      await interaction.editReply({ 
        embeds: [embed], 
        files: [{ attachment: qrBuffer, name: 'qr.png' }]
      });
    } catch (error) {
      logger.error('Error creating payment request:', error);
      await this.sendErrorMessage(interaction, language);
    }
  }

  // Handle /history command
  async handleHistory(interaction, language) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`📊 ${i18n.t('history', language)}`)
      .setDescription('Recent Transactions:')
      .addFields(
        { name: '🟢 Received', value: '5,000 sats\n*2 hours ago*', inline: true },
        { name: '🔴 Sent', value: '1,500 sats\n*1 day ago*', inline: true },
        { name: '🟢 Received', value: '10,000 sats\n*3 days ago*', inline: true }
      )
      .setFooter({ text: 'Full history available in web dashboard' });

    await interaction.reply({ embeds: [embed] });
  }

  // Handle /price command
  async handlePrice(interaction, language) {
    await interaction.deferReply();

    try {
      const usdPrice = await bitcoinService.getBitcoinPrice('USD');
      const eurPrice = await bitcoinService.getBitcoinPrice('EUR');

      const embed = new EmbedBuilder()
        .setColor(0xF7931A)
        .setTitle('₿ Bitcoin Price')
        .addFields(
          { name: '💵 USD', value: `$${usdPrice ? usdPrice.toLocaleString() : 'N/A'}`, inline: true },
          { name: '💶 EUR', value: `€${eurPrice ? eurPrice.toLocaleString() : 'N/A'}`, inline: true },
          { name: '📅 Updated', value: new Date().toLocaleString(), inline: false }
        )
        .setThumbnail('https://bitcoin.org/img/icons/logotop.svg');

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error getting Bitcoin price:', error);
      await this.sendErrorMessage(interaction, language);
    }
  }

  // Handle /language command
  async handleLanguage(interaction, selectedLang) {
    const userId = interaction.user.id;

    if (selectedLang) {
      this.setUserLanguage(userId, selectedLang);
      await interaction.reply({ 
        content: `✅ Language updated to ${i18n.getLanguageName(selectedLang)}`,
        ephemeral: true 
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🌍 Language Settings')
        .setDescription('Choose your preferred language:');

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('lang_en')
            .setLabel('English')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('lang_sw')
            .setLabel('Kiswahili')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('lang_fr')
            .setLabel('Français')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  }

  // Handle /education command
  async handleEducation(interaction, language) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📖 Bitcoin Education')
      .setDescription('Choose a topic to learn more:');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('edu_basics')
          .setLabel('Bitcoin Basics')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📚'),
        new ButtonBuilder()
          .setCustomId('edu_lightning')
          .setLabel('Lightning Network')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚡'),
        new ButtonBuilder()
          .setCustomId('edu_security')
          .setLabel('Security Tips')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔒')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('edu_africa')
          .setLabel('Bitcoin in Africa')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🌍')
      );

    await interaction.reply({ embeds: [embed], components: [row, row2] });
  }

  // Handle /help command
  async handleHelp(interaction, language) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`ℹ️ ${i18n.t('help', language)}`)
      .setDescription('Available commands:')
      .addFields(
        { name: '/start', value: i18n.t('commands.start', language), inline: false },
        { name: '/balance', value: i18n.t('commands.balance', language), inline: false },
        { name: '/send [amount]', value: i18n.t('commands.send', language), inline: false },
        { name: '/receive [amount]', value: i18n.t('commands.receive', language), inline: false },
        { name: '/history', value: i18n.t('commands.history', language), inline: false },
        { name: '/price', value: 'Get current Bitcoin price', inline: false },
        { name: '/education', value: 'Learn about Bitcoin', inline: false },
        { name: '/language', value: i18n.t('commands.language', language), inline: false }
      )
      .setFooter({ text: '🚀 Bitsacco - Empowering Africa with Bitcoin' });

    await interaction.reply({ embeds: [embed] });
  }

  // Handle button interactions
  async handleButtonInteraction(interaction) {
    const userId = interaction.user.id;
    const language = this.getUserLanguage(userId);
    const customId = interaction.customId;

    try {
      await interaction.deferReply();

      if (customId.startsWith('lang_')) {
        const selectedLang = customId.replace('lang_', '');
        this.setUserLanguage(userId, selectedLang);
        await interaction.editReply(`✅ Language updated to ${i18n.getLanguageName(selectedLang)}`);
      } else if (customId.startsWith('send_')) {
        const amount = parseInt(customId.replace('send_', ''));
        await this.handleSend(interaction, language, amount);
      } else if (customId.startsWith('receive_')) {
        const amount = parseInt(customId.replace('receive_', ''));
        await this.createPaymentRequest(interaction, amount, language);
      } else if (customId.startsWith('edu_')) {
        await this.handleEducationTopic(interaction, customId.replace('edu_', ''), language);
      } else {
        // Handle main menu buttons
        switch (customId) {
          case 'balance':
            await this.handleBalance(interaction, language);
            break;
          case 'send':
            await this.handleSend(interaction, language, null);
            break;
          case 'receive':
            await this.handleReceive(interaction, language, null);
            break;
        }
      }
    } catch (error) {
      logger.error('Error handling Discord button interaction:', error);
      await this.sendErrorMessage(interaction, language);
    }
  }

  // Handle education topics
  async handleEducationTopic(interaction, topic, language) {
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

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(title)
      .setDescription(content);

    await interaction.editReply({ embeds: [embed] });
  }

  // Send error message
  async sendErrorMessage(interaction, language) {
    const errorMsg = i18n.t('errors.general', language);
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Error')
      .setDescription(errorMsg);

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  // Stop the bot
  stop() {
    if (this.client) {
      this.client.destroy();
      logger.info('Discord bot stopped');
    }
  }
}

export default new DiscordBotService();