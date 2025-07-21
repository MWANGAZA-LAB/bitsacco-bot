import config from './config/index.js';
import logger from './utils/logger.js';
import telegramBot from './bots/telegram.js';
import discordBot from './bots/discord.js';
import whatsappBot from './bots/whatsapp.js';
import webChatBot from './server/web.js';

class BitsaccoBotApp {
  constructor() {
    this.isRunning = false;
    this.activeBots = [];
  }

  // Initialize and start all enabled bots
  async start() {
    try {
      logger.info('🚀 Starting Bitsacco Bot Application...');
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Log Level: ${config.LOG_LEVEL}`);

      // Create logs directory if it doesn't exist
      await this.ensureLogDirectory();

      // Initialize enabled bots
      await this.initializeBots();

      this.isRunning = true;
      logger.info('✅ Bitsacco Bot Application started successfully!');
      logger.info(`Active bots: ${this.activeBots.join(', ')}`);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start Bitsacco Bot Application:', error);
      process.exit(1);
    }
  }

  // Initialize all enabled bot services
  async initializeBots() {
    // 1. Telegram Bot
    if (config.bots.telegram.enabled) {
      try {
        telegramBot.initialize();
        this.activeBots.push('Telegram');
        logger.info('✅ Telegram bot initialized');
      } catch (error) {
        logger.error('Failed to initialize Telegram bot:', error);
      }
    } else {
      logger.warn('⚠️  Telegram bot disabled (no token provided)');
    }

    // 2. Discord Bot
    if (config.bots.discord.enabled) {
      try {
        discordBot.initialize();
        this.activeBots.push('Discord');
        logger.info('✅ Discord bot initialized');
      } catch (error) {
        logger.error('Failed to initialize Discord bot:', error);
      }
    } else {
      logger.warn('⚠️  Discord bot disabled (no token provided)');
    }

    // 3. WhatsApp Bot
    if (config.bots.whatsapp.enabled) {
      try {
        whatsappBot.initialize();
        this.activeBots.push('WhatsApp');
        logger.info('✅ WhatsApp bot initialized');
      } catch (error) {
        logger.error('Failed to initialize WhatsApp bot:', error);
      }
    } else {
      logger.warn('⚠️  WhatsApp bot disabled');
    }

    // 4. Web Chat Bot (always enabled)
    try {
      webChatBot.initialize();
      this.activeBots.push('Web Chat');
      logger.info('✅ Web chat bot initialized');
    } catch (error) {
      logger.error('Failed to initialize Web chat bot:', error);
    }

    if (this.activeBots.length === 0) {
      throw new Error('No bots were successfully initialized');
    }
  }

  // Ensure logs directory exists
  async ensureLogDirectory() {
    const fs = await import('fs');
    const path = await import('path');
    
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info('📁 Created logs directory');
    }
  }

  // Setup graceful shutdown handlers
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      try {
        // Stop all bots
        if (config.bots.telegram.enabled) {
          telegramBot.stop();
        }
        
        if (config.bots.discord.enabled) {
          discordBot.stop();
        }
        
        if (config.bots.whatsapp.enabled) {
          whatsappBot.stop();
        }
        
        webChatBot.stop();

        this.isRunning = false;
        logger.info('✅ All bots stopped successfully');
        
        // Exit gracefully
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle various shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }

  // Get application status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeBots: this.activeBots,
      config: {
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        enabledFeatures: config.features,
        supportedLanguages: config.i18n.supportedLanguages
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create and start the application
const app = new BitsaccoBotApp();

// Start the application
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

// Export for testing or external use
export default app;