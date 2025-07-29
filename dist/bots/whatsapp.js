import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import bitcoinService from '../services/bitcoin.js';
import bitsaccoApi from '../services/bitsaccoApi.js';
import aiNlpEngine from '../services/aiNlpEngine.js';
class TypedWhatsAppBotService {
    client = null;
    userSessions = new Map();
    isReady = false;
    isInitializing = false;
    sessionTimeout = 30 * 60 * 1000; // 30 minutes
    maxConversationHistory = 10;
    aiMode = false;
    constructor() {
        logger.info('WhatsApp Bot Service initialized (TypeScript)');
        // Enable AI mode if configured
        this.aiMode = config.features?.aiEnabled || false;
        // Schedule session cleanup every 10 minutes
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 10 * 60 * 1000);
    }
    /**
     * Initialize WhatsApp client
     */
    async initialize() {
        if (!config.bots?.whatsapp?.enabled) {
            logger.warn('WhatsApp bot is disabled (TypeScript)');
            return;
        }
        if (this.isInitializing) {
            logger.warn('WhatsApp bot is already initializing (TypeScript)');
            return;
        }
        try {
            this.isInitializing = true;
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: config.bots.whatsapp.sessionName || 'bitsacco-session'
                }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                }
            });
            this.setupEventHandlers();
            await this.client.initialize();
            logger.info('WhatsApp bot initialized successfully (TypeScript)');
        }
        catch (error) {
            logger.error('Failed to initialize WhatsApp bot (TypeScript)', { error: error.message });
            this.isInitializing = false;
            throw error;
        }
    }
    /**
     * Setup WhatsApp client event handlers
     */
    setupEventHandlers() {
        if (!this.client)
            return;
        this.client.on('ready', () => {
            logger.info('WhatsApp bot is ready! (TypeScript)');
            this.isReady = true;
            this.isInitializing = false;
        });
        this.client.on('message', async (message) => {
            if (!this.isReady)
                return;
            try {
                await this.handleMessage(message);
            }
            catch (error) {
                logger.error('Error handling WhatsApp message (TypeScript)', {
                    error: error.message,
                    messageId: message.id?.id,
                    from: message.from
                });
            }
        });
        this.client.on('auth_failure', (message) => {
            logger.error('WhatsApp authentication failed (TypeScript)', { message });
            this.isReady = false;
            this.isInitializing = false;
        });
        this.client.on('disconnected', (reason) => {
            logger.warn('WhatsApp client disconnected (TypeScript)', { reason });
            this.isReady = false;
            this.isInitializing = false;
        });
        this.client.on('qr', (qr) => {
            logger.info('WhatsApp QR Code received (TypeScript)');
            // In production, you might want to display this QR code
            console.log('QR RECEIVED', qr);
        });
    }
    /**
     * Main message handler with AI integration
     */
    async handleMessage(message) {
        // Skip group messages and status updates
        if (message.from.includes('@g.us') || message.from.includes('status@broadcast')) {
            return;
        }
        const userId = message.from;
        const text = message.body?.trim() || '';
        const messageContext = this.createMessageContext(message);
        let session = this.userSessions.get(userId) || { state: 'init' };
        session.lastActivity = new Date();
        // Initialize conversation history
        if (!session.conversationHistory) {
            session.conversationHistory = [];
        }
        // Add user message to history
        session.conversationHistory.push(`User: ${text}`);
        this.trimConversationHistory(session);
        logger.info('Processing WhatsApp message (TypeScript)', {
            userId: this.maskUserId(userId),
            messageLength: text.length,
            sessionState: session.state,
            messageType: messageContext.messageType
        });
        // Handle different session states
        try {
            if (this.aiMode && session.state === 'authenticated') {
                await this.handleAIConversation(userId, text, session, messageContext);
            }
            else {
                await this.handleStateMachine(userId, text, session, messageContext);
            }
        }
        catch (error) {
            logger.error('Message handling error (TypeScript)', {
                userId: this.maskUserId(userId),
                error: error.message,
                sessionState: session.state
            });
            await this.sendMessage(userId, 'Sorry, I encountered an error. Please try again or contact support.');
        }
    }
    /**
     * Handle AI-powered conversation for authenticated users
     */
    async handleAIConversation(userId, text, session, messageContext) {
        try {
            const phoneNumber = session.phone || messageContext.phoneNumber || userId;
            // Process message with AI NLP Engine
            const aiResponse = await aiNlpEngine.processMessage(userId, phoneNumber, text);
            if (aiResponse.success && aiResponse.data) {
                // Send AI response
                await this.sendMessage(userId, aiResponse.data.text);
                // Add AI response to conversation history
                session.conversationHistory?.push(`Assistant: ${aiResponse.data.text}`);
                this.trimConversationHistory(session);
                // Handle any actions suggested by AI
                if (aiResponse.data.actions && aiResponse.data.actions.length > 0) {
                    await this.processAIActions(userId, aiResponse.data.actions, session);
                }
                // Send audio if available
                if (aiResponse.data.audioFile) {
                    await this.sendAudioMessage(userId, aiResponse.data.audioFile);
                }
            }
            else {
                // Fallback to traditional state machine
                await this.handleStateMachine(userId, text, session, messageContext);
            }
            this.userSessions.set(userId, session);
        }
        catch (error) {
            logger.error('AI conversation handling failed (TypeScript)', {
                userId: this.maskUserId(userId),
                error: error.message
            });
            // Fallback to traditional handling
            await this.handleStateMachine(userId, text, session, messageContext);
        }
    }
    /**
     * Handle traditional state machine conversation flow
     */
    async handleStateMachine(userId, text, session, _messageContext) {
        // State machine for login and actions
        if (session.state === 'init' || text.toLowerCase() === '/start' || text.toLowerCase() === 'hi') {
            await this.sendBranding(userId);
            await this.promptPhone(userId);
            session = { state: 'awaiting_phone', lastActivity: new Date() };
            this.userSessions.set(userId, session);
            return;
        }
        if (session.state === 'awaiting_phone') {
            const phone = this.normalizePhoneNumber(text);
            if (!this.isValidPhoneNumber(phone)) {
                await this.sendMessage(userId, 'Please enter a valid phone number (include country code).');
                return;
            }
            await this.sendMessage(userId, `Sending OTP to ${phone}...`);
            const otpResult = await bitsaccoApi.sendOtp(phone);
            if (otpResult.success) {
                await this.sendMessage(userId, 'Please enter the 6-digit OTP sent to your phone.');
                session.state = 'awaiting_otp';
                session.phone = phone;
            }
            else {
                await this.sendMessage(userId, 'Failed to send OTP. Please try again.');
            }
            this.userSessions.set(userId, session);
            return;
        }
        if (session.state === 'awaiting_otp') {
            const otp = text.replace(/\D/g, '');
            if (otp.length !== 6) {
                await this.sendMessage(userId, 'Please enter a valid 6-digit OTP.');
                return;
            }
            const result = await bitsaccoApi.verifyOtp(session.phone, otp);
            if (result.success) {
                session.state = 'authenticated';
                session.bitsaccoUserId = result.userId;
                const welcomeMessage = this.aiMode
                    ? '✅ You are signed in! I can help you with your Bitcoin savings, transactions, and financial goals. What would you like to do?'
                    : '✅ You are signed in!\nType "balance", "load", "withdraw", or "history".';
                await this.sendMessage(userId, welcomeMessage);
            }
            else {
                await this.sendMessage(userId, '❌ Invalid OTP. Please try again.');
            }
            this.userSessions.set(userId, session);
            return;
        }
        // Only allow actions if authenticated
        if (session.state !== 'authenticated' || !session.bitsaccoUserId) {
            await this.sendMessage(userId, 'Please sign in first. Type /start to begin.');
            return;
        }
        // Handle account actions
        await this.handleAuthenticatedCommands(userId, text, session);
    }
    /**
     * Handle commands for authenticated users
     */
    async handleAuthenticatedCommands(userId, text, session) {
        const command = text.toLowerCase();
        if (/^balance$/i.test(command)) {
            const res = await bitsaccoApi.getBalance(session.bitsaccoUserId);
            if (res.success) {
                const formattedBalance = `Your Bitsacco balance:\n💰 ${res.currency} ${res.balance.toLocaleString()}`;
                if (res.btcBalance) {
                    formattedBalance + `\n₿ ${res.btcBalance.toFixed(8)} BTC`;
                }
                await this.sendMessage(userId, formattedBalance);
            }
            else {
                await this.sendMessage(userId, 'Could not fetch balance. Please try again.');
            }
            return;
        }
        if (/^load$/i.test(command)) {
            session.state = 'awaiting_load_amount';
            await this.sendMessage(userId, 'How much would you like to load? (Enter amount in KES)');
            this.userSessions.set(userId, session);
            return;
        }
        if (session.state === 'awaiting_load_amount') {
            const amount = parseFloat(text.replace(/[^\d.]/g, ''));
            if (isNaN(amount) || amount <= 0) {
                await this.sendMessage(userId, 'Please enter a valid amount.');
                return;
            }
            session.loadAmount = amount;
            session.state = 'awaiting_load_method';
            await this.sendMessage(userId, 'Which method would you like to use?\n1. M-Pesa\n2. Bank Transfer\n3. Card Payment\n\nReply with: mpesa, bank, or card');
            this.userSessions.set(userId, session);
            return;
        }
        if (session.state === 'awaiting_load_method') {
            const method = command;
            const validMethods = ['mpesa', 'bank', 'card'];
            if (!validMethods.includes(method)) {
                await this.sendMessage(userId, 'Please choose: mpesa, bank, or card');
                return;
            }
            const res = await bitsaccoApi.loadMoney(session.bitsaccoUserId, session.loadAmount, method);
            if (res.success) {
                await this.sendMessage(userId, `💳 Deposit instructions:\n\n${res.paymentInstructions || res.message}`);
            }
            else {
                await this.sendMessage(userId, 'Could not initiate deposit. Please try again.');
            }
            session.state = 'authenticated';
            delete session.loadAmount;
            this.userSessions.set(userId, session);
            return;
        }
        // Similar patterns for withdraw flow...
        if (/^withdraw$/i.test(command)) {
            session.state = 'awaiting_withdraw_amount';
            await this.sendMessage(userId, 'How much would you like to withdraw?');
            this.userSessions.set(userId, session);
            return;
        }
        if (/^history$/i.test(command)) {
            const res = await bitsaccoApi.getTransactionHistory(session.bitsaccoUserId);
            if (res.success && res.transactions.length > 0) {
                let msg = '📊 Recent transactions:\n\n';
                for (const tx of res.transactions.slice(0, 5)) { // Show only last 5
                    const emoji = this.getTransactionEmoji(tx.type);
                    msg += `${emoji} ${tx.type} ${tx.amount} ${tx.currency} on ${new Date(tx.date).toLocaleDateString()} (${tx.status})\n`;
                }
                await this.sendMessage(userId, msg);
            }
            else {
                await this.sendMessage(userId, 'No recent transactions found.');
            }
            return;
        }
        // Fallback for unrecognized commands
        const helpMessage = this.aiMode
            ? 'I can help you with your Bitcoin savings and transactions. You can ask me about your balance, making deposits, withdrawals, transaction history, or any Bitcoin-related questions!'
            : 'Available commands:\n• balance - Check your balance\n• load - Add money\n• withdraw - Take money out\n• history - View transactions\n\nOr ask me any Bitcoin question!';
        await this.sendMessage(userId, helpMessage);
    }
    /**
     * Process AI-suggested actions
     */
    async processAIActions(userId, actions, session) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'balance_retrieved':
                        // Balance was already handled in AI response
                        break;
                    case 'goals_displayed':
                        // Goals information was included in AI response
                        break;
                    case 'chamas_displayed':
                        // Chama information was included in AI response
                        break;
                    default:
                        logger.debug('Unknown AI action type (TypeScript)', { actionType: action.type });
                }
            }
            catch (error) {
                logger.error('Failed to process AI action (TypeScript)', {
                    actionType: action.type,
                    error: error.message
                });
            }
        }
    }
    /**
     * Send branding message with logo and Bitcoin price
     */
    async sendBranding(userId, options = {}) {
        const { includeLogo = true, includeBtcPrice = true, includeWelcome = true } = options;
        try {
            if (includeLogo) {
                const logoPath = path.join(process.cwd(), 'bitsaccologo.PNG');
                if (fs.existsSync(logoPath)) {
                    const logoData = fs.readFileSync(logoPath, { encoding: 'base64' });
                    const media = new MessageMedia('image/png', logoData, 'bitsacco-logo.png');
                    const caption = includeWelcome ? '🚀 Welcome to Bitsacco!\n\n*Plan. Save. Grow.*' : undefined;
                    await this.client?.sendMessage(userId, media, { caption });
                }
            }
            if (includeBtcPrice) {
                try {
                    const btcPrice = await bitcoinService.getBitcoinPrice('USD');
                    if (btcPrice) {
                        await this.sendMessage(userId, `₿ 1 BTC = $${btcPrice.toLocaleString()} USD`);
                    }
                }
                catch (err) {
                    logger.warn('Could not fetch or send Bitcoin price (TypeScript)', { error: err.message });
                }
            }
        }
        catch (err) {
            logger.warn('Could not send Bitsacco branding (TypeScript)', { error: err.message });
        }
    }
    /**
     * Prompt user for phone number
     */
    async promptPhone(userId) {
        await this.sendMessage(userId, '📱 Please enter your phone number to sign in (include country code, e.g., +254700123456).');
    }
    /**
     * Send text message
     */
    async sendMessage(to, text, options = {}) {
        try {
            if (!this.client || !this.isReady) {
                throw new Error('WhatsApp client is not ready');
            }
            await this.client.sendMessage(to, text, options);
            logger.debug('WhatsApp message sent (TypeScript)', {
                to: this.maskUserId(to),
                messageLength: text.length
            });
        }
        catch (error) {
            logger.error('Error sending WhatsApp message (TypeScript)', {
                to: this.maskUserId(to),
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Send audio message
     */
    async sendAudioMessage(to, audioFilePath) {
        try {
            if (!fs.existsSync(audioFilePath)) {
                logger.warn('Audio file not found (TypeScript)', { audioFilePath });
                return;
            }
            const audioData = fs.readFileSync(audioFilePath, { encoding: 'base64' });
            const media = new MessageMedia('audio/mpeg', audioData, 'voice.mp3');
            await this.client?.sendMessage(to, media);
            logger.debug('WhatsApp audio message sent (TypeScript)', {
                to: this.maskUserId(to),
                audioFile: path.basename(audioFilePath)
            });
        }
        catch (error) {
            logger.error('Error sending WhatsApp audio message (TypeScript)', {
                to: this.maskUserId(to),
                error: error.message
            });
        }
    }
    /**
     * Create message context from WhatsApp message
     */
    createMessageContext(message) {
        return {
            userId: message.from,
            phoneNumber: message.from.split('@')[0],
            isGroupMessage: message.from.includes('@g.us'),
            messageType: this.getMessageType(message),
            timestamp: new Date(message.timestamp * 1000)
        };
    }
    /**
     * Get message type from WhatsApp message
     */
    getMessageType(message) {
        if (message.hasMedia) {
            if (message.type === 'image')
                return 'image';
            if (message.type === 'audio' || message.type === 'ptt')
                return 'audio';
            if (message.type === 'document')
                return 'document';
            return 'other';
        }
        return 'text';
    }
    /**
     * Normalize phone number format
     */
    normalizePhoneNumber(phone) {
        // Remove all non-digits first
        const digits = phone.replace(/\D/g, '');
        // Handle Kenyan numbers
        if (digits.startsWith('254')) {
            return '+' + digits;
        }
        else if (digits.startsWith('0') && digits.length === 10) {
            return '+254' + digits.substring(1);
        }
        else if (digits.length === 9) {
            return '+254' + digits;
        }
        // For other countries, assume they included country code
        return '+' + digits;
    }
    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phone) {
        // Basic validation - should start with + and have at least 10 digits
        const phoneRegex = /^\+\d{10,15}$/;
        return phoneRegex.test(phone);
    }
    /**
     * Get emoji for transaction type
     */
    getTransactionEmoji(type) {
        const emojiMap = {
            'deposit': '💰',
            'withdrawal': '💸',
            'bitcoin_purchase': '₿',
            'bitcoin_sale': '🔄',
            'transfer': '📤',
            'received': '📥'
        };
        return emojiMap[type] || '📊';
    }
    /**
     * Trim conversation history to max length
     */
    trimConversationHistory(session) {
        if (session.conversationHistory && session.conversationHistory.length > this.maxConversationHistory) {
            session.conversationHistory = session.conversationHistory.slice(-this.maxConversationHistory);
        }
    }
    /**
     * Clean up inactive user sessions
     */
    cleanupInactiveSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [userId, session] of this.userSessions) {
            if (session.lastActivity && now - session.lastActivity.getTime() > this.sessionTimeout) {
                this.userSessions.delete(userId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger.info('Cleaned up inactive sessions (TypeScript)', {
                cleanedSessions: cleanedCount,
                activeSessions: this.userSessions.size
            });
        }
    }
    /**
     * Mask user ID for logging privacy
     */
    maskUserId(userId) {
        if (userId.length <= 8)
            return userId;
        return userId.substring(0, 4) + '****' + userId.substring(userId.length - 4);
    }
    /**
     * Get WhatsApp bot statistics
     */
    getStats() {
        return {
            isReady: this.isReady,
            isInitializing: this.isInitializing,
            activeSessions: this.userSessions.size,
            aiMode: this.aiMode,
            sessionTimeout: this.sessionTimeout,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Stop WhatsApp client
     */
    async stop() {
        try {
            if (this.client) {
                await this.client.destroy();
                this.isReady = false;
                this.isInitializing = false;
                logger.info('WhatsApp bot stopped (TypeScript)');
            }
        }
        catch (error) {
            logger.error('Error stopping WhatsApp bot (TypeScript)', { error: error.message });
        }
    }
    /**
     * Check if client is ready
     */
    isClientReady() {
        return this.isReady;
    }
}
// Export singleton instance
export const typedWhatsAppBot = new TypedWhatsAppBotService();
export default typedWhatsAppBot;
//# sourceMappingURL=whatsapp.js.map