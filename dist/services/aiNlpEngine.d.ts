interface MessageProcessResult {
    success: boolean;
    data: {
        text: string;
        actions: any[];
        intent: string;
        audioFile?: string | null;
        suggestions: string[];
        requiresInput: boolean;
    };
    message?: string;
    responseTime: number;
}
declare class TypedAINLPEngine {
    private apiKey;
    private model;
    private isEnabled;
    private conversationContexts;
    private intentCache;
    private maxContextLength;
    private systemPrompt;
    private intentPatterns;
    constructor();
    /**
     * Process user message and generate response
     */
    processMessage(userId: string, phoneNumber: string, message: string): Promise<MessageProcessResult>;
    /**
     * Recognize intent from user message
     */
    recognizeIntent(message: string): string;
    /**
     * Check if message is authentication related
     */
    private isAuthRelatedMessage;
    /**
     * Handle authentication flow
     */
    private handleAuthenticationFlow;
    /**
     * Prepare context for AI processing
     */
    private prepareAIContext;
    /**
     * Generate AI response using OpenAI
     */
    private generateAIResponse;
    /**
     * Call OpenAI API
     */
    private callOpenAIAPI;
    /**
     * Process AI response and execute actions
     */
    private processAIResponse;
    /**
     * Execute action from AI response
     */
    private executeAction;
    /**
     * Generate suggestions based on intent
     */
    private generateSuggestions;
    /**
     * Get fallback response when AI is unavailable
     */
    private getFallbackResponse;
    /**
     * Get conversation context for user
     */
    private getConversationContext;
    /**
     * Trim conversation context to max length
     */
    private trimConversationContext;
    /**
     * Clear conversation context for user
     */
    clearConversationContext(userId: string): void;
    /**
     * Get AI NLP Engine statistics
     */
    getStats(): any;
    /**
     * Clean up old contexts and cache
     */
    cleanup(): void;
}
export declare const typedAiNLPEngine: TypedAINLPEngine;
export default typedAiNLPEngine;
//# sourceMappingURL=aiNlpEngine.d.ts.map