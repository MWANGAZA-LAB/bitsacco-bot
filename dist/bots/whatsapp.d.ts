interface SendMessageOptions {
    caption?: string;
    mentions?: string[];
    quotedMessageId?: string;
}
declare class TypedWhatsAppBotService {
    private client;
    private userSessions;
    private isReady;
    private isInitializing;
    private sessionTimeout;
    private maxConversationHistory;
    private aiMode;
    constructor();
    /**
     * Initialize WhatsApp client
     */
    initialize(): Promise<void>;
    /**
     * Setup WhatsApp client event handlers
     */
    private setupEventHandlers;
    /**
     * Main message handler with AI integration
     */
    private handleMessage;
    /**
     * Handle AI-powered conversation for authenticated users
     */
    private handleAIConversation;
    /**
     * Handle traditional state machine conversation flow
     */
    private handleStateMachine;
    /**
     * Handle commands for authenticated users
     */
    private handleAuthenticatedCommands;
    /**
     * Process AI-suggested actions
     */
    private processAIActions;
    /**
     * Send branding message with logo and Bitcoin price
     */
    private sendBranding;
    /**
     * Prompt user for phone number
     */
    private promptPhone;
    /**
     * Send text message
     */
    sendMessage(to: string, text: string, options?: SendMessageOptions): Promise<void>;
    /**
     * Send audio message
     */
    private sendAudioMessage;
    /**
     * Create message context from WhatsApp message
     */
    private createMessageContext;
    /**
     * Get message type from WhatsApp message
     */
    private getMessageType;
    /**
     * Normalize phone number format
     */
    private normalizePhoneNumber;
    /**
     * Validate phone number format
     */
    private isValidPhoneNumber;
    /**
     * Get emoji for transaction type
     */
    private getTransactionEmoji;
    /**
     * Trim conversation history to max length
     */
    private trimConversationHistory;
    /**
     * Clean up inactive user sessions
     */
    private cleanupInactiveSessions;
    /**
     * Mask user ID for logging privacy
     */
    private maskUserId;
    /**
     * Get WhatsApp bot statistics
     */
    getStats(): any;
    /**
     * Stop WhatsApp client
     */
    stop(): Promise<void>;
    /**
     * Check if client is ready
     */
    isClientReady(): boolean;
}
export declare const typedWhatsAppBot: TypedWhatsAppBotService;
export default typedWhatsAppBot;
//# sourceMappingURL=whatsapp.d.ts.map