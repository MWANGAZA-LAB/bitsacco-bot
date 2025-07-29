import { performance } from 'perf_hooks';
import https from 'https';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import authService from './auth.js';
import chamaService from './chama.js';
import goalEngine from './goalEngine.js';
import voiceSynthesizer from './voiceSynthesizer.js';

/**
 * AI NLP Engine Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Intelligent conversation handling using OpenAI GPT-4
 * Following the exact design document specifications
 * 
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  actions?: any[];
}

interface AIContext {
  user: {
    id: string;
    phone: string;
    isAuthenticated: boolean;
  };
  intent: string;
  timestamp: string;
  services: {
    wallet?: any;
    goals?: any;
    chamas?: any;
    price?: any;
  };
}

interface AIResponse {
  success: boolean;
  data?: {
    text: string;
    usage?: any;
  };
  message?: string;
}

interface ProcessedResponse {
  text: string;
  actions: any[];
  suggestions: string[];
  requiresInput: boolean;
  audioFile?: string;
}

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

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: any;
}

interface IntentPatterns {
  [key: string]: string[];
}

interface VoiceSynthesisResult {
  success: boolean;
  data?: {
    audioFile?: string;
  };
}

class TypedAINLPEngine {
  private apiKey: string;
  private model: string;
  private isEnabled: boolean;
  private conversationContexts: Map<string, ConversationMessage[]> = new Map();
  private intentCache: Map<string, string> = new Map();
  private maxContextLength: number;
  private systemPrompt: string;
  private intentPatterns: IntentPatterns;

  constructor() {
    this.apiKey = config.openai?.apiKey || '';
    this.model = config.openai?.model || 'gpt-4-turbo-preview';
    this.isEnabled = Boolean(this.apiKey);
    this.maxContextLength = config.openai?.maxTokens || 10;
    
    // System prompt for Bitsacco assistant
    this.systemPrompt = `You are Bitsacco, an intelligent WhatsApp assistant that helps Kenyan SACCO members save money through Bitcoin investments. You are knowledgeable, friendly, and always focused on financial education and Bitcoin savings.

Key Features:
- Help users save Bitcoin through M-Pesa deposits
- Manage savings goals and track progress in SACCO accounts
- Create and manage group savings (Chamas) for Bitcoin investments  
- Send reminders and tips about Bitcoin saving strategies
- Provide Bitcoin price insights and educational content for savers

Important Guidelines:
- Always respond in a helpful, encouraging tone
- Keep responses concise for WhatsApp messaging
- Use Kenyan context and SACCO terminology when appropriate
- Encourage Bitcoin savings and long-term holding for wealth building
- Provide clear, actionable instructions
- Ask for clarification when user intent is unclear
- Include relevant emojis to make conversations engaging

User Context: You're chatting with Kenyan users via WhatsApp who want to save money and learn about Bitcoin.`;

    // Intent patterns for quick recognition
    this.intentPatterns = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'mambo', 'habari'],
      balance: ['balance', 'how much', 'my bitcoin', 'wallet', 'savings'],
      save: ['save', 'deposit', 'invest', 'add money', 'contribute', 'accumulate'],
      withdraw: ['withdraw', 'cash out', 'redeem', 'liquidate'],
      price: ['price', 'rate', 'cost', 'value', 'bitcoin price'],
      goals: ['goal', 'target', 'save for', 'saving plan'],
      chama: ['chama', 'group', 'friends', 'together', 'collective'],
      help: ['help', 'how', 'what', 'explain', 'guide', 'instructions'],
      tips: ['tip', 'advice', 'learn', 'education', 'knowledge']
    };

    if (!this.isEnabled) {
      logger.warn('AI NLP Engine disabled: OpenAI API key not configured');
    }
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    userId: string, 
    phoneNumber: string, 
    message: string
  ): Promise<MessageProcessResult> {
    const startTime = performance.now();
    const sessionId = `nlp_${Date.now()}_${userId.substring(0, 8)}`;
    
    try {
      // Check if user is authenticated
      const authCheck = await authService.validateSession(userId);
      const isAuthenticated = Boolean(authCheck);

      // Quick intent recognition
      const intent = this.recognizeIntent(message);
      
      // Handle authentication flow first
      if (!isAuthenticated && !this.isAuthRelatedMessage(message)) {
        return await this.handleAuthenticationFlow(userId, phoneNumber, message, intent);
      }

      // Get conversation context
      const conversationContext = this.getConversationContext(userId);
      
      // Add current message to context
      conversationContext.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
        intent
      });

      // Prepare context for AI
      const aiContext = await this.prepareAIContext(userId, phoneNumber, intent);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(conversationContext, aiContext);
      
      if (!aiResponse.success) {
        throw new Error(`AI response generation failed: ${aiResponse.message}`);
      }

      // Process AI response and execute actions
      const processedResponse = await this.processAIResponse(
        userId, phoneNumber, aiResponse.data!, intent
      );

      // Update conversation context
      conversationContext.push({
        role: 'assistant',
        content: processedResponse.text,
        timestamp: new Date(),
        actions: processedResponse.actions || []
      });

      // Trim context if too long
      this.trimConversationContext(userId);

      const responseTime = Math.round(performance.now() - startTime);
      
      logger.info('Message processed successfully (TypeScript)', {
        sessionId,
        userId,
        intent,
        messageLength: message.length,
        responseLength: processedResponse.text.length,
        actionsCount: processedResponse.actions?.length || 0,
        responseTime
      });

      return {
        success: true,
        data: {
          text: processedResponse.text,
          actions: processedResponse.actions || [],
          intent,
          audioFile: processedResponse.audioFile || null,
          suggestions: processedResponse.suggestions || [],
          requiresInput: processedResponse.requiresInput || false
        },
        responseTime
      };

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      
      logger.error('Message processing failed (TypeScript)', {
        sessionId,
        userId,
        messageLength: message?.length || 0,
        error: error.message,
        responseTime
      });

      // Fallback response
      return {
        success: false,
        data: {
          text: "I'm having trouble understanding your message right now. Please try again or type 'help' for assistance.",
          intent: 'error',
          actions: [],
          suggestions: ['Help', 'Balance', 'Save Bitcoin', 'Goals'],
          requiresInput: false
        },
        message: error.message,
        responseTime
      };
    }
  }

  /**
   * Recognize intent from user message
   */
  recognizeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check cache first
    const cacheKey = `intent_${lowerMessage}`;
    if (this.intentCache.has(cacheKey)) {
      return this.intentCache.get(cacheKey)!;
    }

    let bestIntent = 'general';
    let maxMatches = 0;

    // Pattern matching
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      const matches = patterns.filter(pattern => 
        lowerMessage.includes(pattern.toLowerCase())
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIntent = intent;
      }
    }

    // Special case handling
    if (lowerMessage.includes('otp') || lowerMessage.includes('code')) {
      bestIntent = 'auth_otp';
    } else if (/^\d{4,6}$/.test(lowerMessage.trim())) {
      bestIntent = 'auth_otp_verification';
    } else if (lowerMessage.includes('register') || lowerMessage.includes('sign up')) {
      bestIntent = 'auth_register';
    }

    // Cache the result
    this.intentCache.set(cacheKey, bestIntent);
    
    return bestIntent;
  }

  /**
   * Check if message is authentication related
   */
  private isAuthRelatedMessage(message: string): boolean {
    const authKeywords = ['register', 'sign up', 'login', 'otp', 'code', 'verify'];
    const lowerMessage = message.toLowerCase();
    
    return authKeywords.some(keyword => lowerMessage.includes(keyword)) ||
           /^\d{4,6}$/.test(message.trim());
  }

  /**
   * Handle authentication flow
   */
  private async handleAuthenticationFlow(
    userId: string, 
    phoneNumber: string, 
    message: string, 
    intent: string
  ): Promise<MessageProcessResult> {
    try {
      if (intent === 'auth_otp_verification' || /^\d{4,6}$/.test(message.trim())) {
        // Verify OTP
        const otpCode = message.trim();
        const verifyResult = await authService.verifyOTP(phoneNumber, otpCode);
        
        if (verifyResult.success) {
          return {
            success: true,
            data: {
              text: `🎉 Welcome to Bitsacco! Your account is now verified. You can now start saving Bitcoin with M-Pesa.\n\nType 'help' to see what I can do for you!`,
              intent: 'auth_success',
              actions: [],
              suggestions: ['Balance', 'Save Bitcoin', 'Set Goal', 'Help'],
              requiresInput: false
            },
            responseTime: 0
          };
        } else {
          return {
            success: true,
            data: {
              text: `❌ Invalid verification code. Please try again or request a new code.`,
              intent: 'auth_error',
              actions: [],
              suggestions: ['Get New Code'],
              requiresInput: false
            },
            responseTime: 0
          };
        }
      } else {
        // Generate OTP for new user
        const otpResult = await authService.generateOTP(phoneNumber);
        
        if (otpResult.success) {
          return {
            success: true,
            data: {
              text: `Welcome to Bitsacco! 🚀\n\nI've sent a verification code to ${phoneNumber}. Please reply with the 4-6 digit code to get started.`,
              intent: 'auth_otp_sent',
              actions: [],
              suggestions: [],
              requiresInput: true
            },
            responseTime: 0
          };
        } else {
          return {
            success: true,
            data: {
              text: `Sorry, I couldn't send a verification code right now. Please try again later.`,
              intent: 'auth_error',
              actions: [],
              suggestions: [],
              requiresInput: false
            },
            responseTime: 0
          };
        }
      }
    } catch (error: any) {
      logger.error('Authentication flow error (TypeScript)', { userId, phoneNumber, error: error.message });
      
      return {
        success: true,
        data: {
          text: `There was an issue with authentication. Please try again.`,
          intent: 'auth_error',
          actions: [],
          suggestions: [],
          requiresInput: false
        },
        responseTime: 0
      };
    }
  }

  /**
   * Prepare context for AI processing
   */
  private async prepareAIContext(
    userId: string, 
    phoneNumber: string, 
    intent: string
  ): Promise<AIContext> {
    const aiContext: AIContext = {
      user: {
        id: userId,
        phone: phoneNumber,
        isAuthenticated: true
      },
      intent,
      timestamp: new Date().toISOString(),
      services: {}
    };

    try {
      // Get relevant data based on intent
      switch (intent) {
        case 'balance':
        case 'save':
        case 'withdraw':
          // Simplified for now - would call actual wallet service
          aiContext.services.wallet = { balance: 0 };
          break;
          
        case 'goals':
          const goals = await goalEngine.getUserGoals(userId);
          aiContext.services.goals = { goals };
          break;
          
        case 'chama':
          const chamas = await chamaService.getUserChamas(userId);
          aiContext.services.chamas = { chamas };
          break;
          
        case 'price':
          // Get Bitcoin price
          aiContext.services.price = { btc_kes: 8775000, btc_usd: 67500 };
          break;
      }
    } catch (error: any) {
      logger.warn('Context preparation warning (TypeScript)', { userId, intent, error: error.message });
    }

    return aiContext;
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    conversationContext: ConversationMessage[], 
    aiContext: AIContext
  ): Promise<AIResponse> {
    if (!this.isEnabled) {
      return this.getFallbackResponse(aiContext.intent);
    }

    try {
      // Prepare messages for OpenAI
      const messages: OpenAIMessage[] = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `Context: ${JSON.stringify(aiContext)}` },
        ...conversationContext.slice(-this.maxContextLength).map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        }))
      ];

      // Call OpenAI API
      const response = await this.callOpenAIAPI(messages);
      
      return {
        success: true,
        data: {
          text: response.choices[0]?.message?.content || 'No response generated',
          usage: response.usage
        }
      };

    } catch (error: any) {
      logger.error('OpenAI API call failed (TypeScript)', { error: error.message });
      return this.getFallbackResponse(aiContext.intent);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAIAPI(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      });

      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`OpenAI API error: ${response.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error('Failed to parse OpenAI response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`OpenAI request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Process AI response and execute actions
   */
  private async processAIResponse(
    userId: string, 
    phoneNumber: string, 
    aiResponse: { text: string; usage?: any }, 
    intent: string
  ): Promise<ProcessedResponse> {
    const response: ProcessedResponse = {
      text: aiResponse.text,
      actions: [],
      suggestions: this.generateSuggestions(intent),
      requiresInput: false
    };

    // Extract action commands from AI response
    const actionMatches = aiResponse.text.match(/\[ACTION:([^\]]+)\]/g);
    
    if (actionMatches) {
      for (const match of actionMatches) {
        const action = match.replace(/\[ACTION:|\]/g, '').trim();
        await this.executeAction(userId, phoneNumber, action, response);
      }
      
      // Remove action commands from visible text
      response.text = response.text.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    }

    // Generate voice response if enabled
    if (config.features?.voiceEnabled && response.text.length < 500) {
      try {
        const voiceResult = await voiceSynthesizer.synthesizeText(response.text) as VoiceSynthesisResult;
        if (voiceResult.success && voiceResult.data?.audioFile) {
          response.audioFile = voiceResult.data.audioFile;
        }
      } catch (error: any) {
        logger.warn('Voice synthesis failed (TypeScript)', { error: error.message });
      }
    }

    return response;
  }

  /**
   * Execute action from AI response
   */
  private async executeAction(
    userId: string, 
    _phoneNumber: string, 
    action: string, 
    response: ProcessedResponse
  ): Promise<void> {
    try {
      const [command, ...params] = action.split(':');
      
      if (!command) {
        return;
      }
      
      switch (command.toLowerCase()) {
        case 'get_balance':
          // Simplified - would call actual wallet service
          response.actions.push({
            type: 'balance_retrieved',
            data: { balance: 0 }
          });
          break;
          
        case 'show_goals':
          const goals = await goalEngine.getUserGoals(userId);
          response.actions.push({
            type: 'goals_displayed',
            data: goals
          });
          break;
          
        case 'show_chamas':
          const chamas = await chamaService.getUserChamas(userId);
          response.actions.push({
            type: 'chamas_displayed', 
            data: chamas
          });
          break;
          
        case 'require_input':
          response.requiresInput = true;
          response.suggestions = params.length > 0 ? params : response.suggestions;
          break;
      }
    } catch (error: any) {
      logger.error('Action execution failed (TypeScript)', { action, error: error.message });
    }
  }

  /**
   * Generate suggestions based on intent
   */
  private generateSuggestions(intent: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      greeting: ['Balance', 'Save Bitcoin', 'My Goals', 'Help'],
      balance: ['Save Bitcoin', 'Transfer', 'Set Goal'],
      save: ['KES 100', 'KES 500', 'KES 1000', 'Custom Amount'],
      goals: ['Create Goal', 'View Goals', 'Contribute'],
      chama: ['Create Chama', 'Join Chama', 'My Chamas'],
      help: ['Save Bitcoin', 'Goals', 'Chamas', 'Tips'],
      general: ['Balance', 'Save Bitcoin', 'Goals', 'Help']
    };

    return suggestions[intent] || suggestions['general'] || [];
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private getFallbackResponse(intent: string): AIResponse {
    const fallbacks: { [key: string]: string } = {
      greeting: "Hello! Welcome to Bitsacco SACCO. I help you save money through Bitcoin investments using M-Pesa. How can I help you today?",
      balance: "To check your balance, I need to access our services. Please try again in a moment.",
      save: "To save Bitcoin, please send me the amount in KES you'd like to invest (e.g., 'Save 500').",
      help: "I can help you:\n• Save Bitcoin with M-Pesa\n• Check your SACCO balance\n• Set savings goals\n• Join group savings (Chamas)\n\nWhat would you like to do?",
      general: "I'm here to help you save money with Bitcoin! Type 'help' to see what I can do."
    };

    return {
      success: true,
      data: {
        text: fallbacks[intent] || fallbacks['general'] || 'I\'m here to help you save money with Bitcoin!'
      }
    };
  }

  /**
   * Get conversation context for user
   */
  private getConversationContext(userId: string): ConversationMessage[] {
    if (!this.conversationContexts.has(userId)) {
      this.conversationContexts.set(userId, []);
    }
    return this.conversationContexts.get(userId)!;
  }

  /**
   * Trim conversation context to max length
   */
  private trimConversationContext(userId: string): void {
    const context = this.conversationContexts.get(userId);
    if (context && context.length > this.maxContextLength) {
      context.splice(0, context.length - this.maxContextLength);
    }
  }

  /**
   * Clear conversation context for user
   */
  clearConversationContext(userId: string): void {
    this.conversationContexts.delete(userId);
    logger.info('Conversation context cleared (TypeScript)', { userId });
  }

  /**
   * Get AI NLP Engine statistics
   */
  getStats(): any {
    return {
      isEnabled: this.isEnabled,
      model: this.model,
      activeConversations: this.conversationContexts.size,
      intentCacheSize: this.intentCache.size,
      maxContextLength: this.maxContextLength,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clean up old contexts and cache
   */
  cleanup(): void {
    // Clear contexts older than 24 hours
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    for (const [userId, context] of this.conversationContexts) {
      if (context.length > 0) {
        const lastMessage = context[context.length - 1];
        if (lastMessage && now - new Date(lastMessage.timestamp).getTime() > maxAge) {
          this.conversationContexts.delete(userId);
        }
      }
    }

    // Clear intent cache if too large
    if (this.intentCache.size > 1000) {
      this.intentCache.clear();
    }
  }
}

// Export singleton instance
export const typedAiNLPEngine = new TypedAINLPEngine();

// Schedule cleanup every hour
setInterval(() => {
  typedAiNLPEngine.cleanup();
}, 60 * 60 * 1000);

export default typedAiNLPEngine;
