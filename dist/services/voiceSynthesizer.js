import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { ElevenLabsAPI } from '@elevenlabs/elevenlabs-js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
class TypedVoiceSynthesizer {
    apiKey;
    voiceId;
    audioCache = new Map();
    isEnabled;
    requestQueue = [];
    isProcessing = false;
    client = null;
    supportedLanguages;
    defaultSettings;
    maxTextLength;
    cacheTimeout = 60 * 60 * 1000; // 1 hour
    fileCleanupAge = 24 * 60 * 60 * 1000; // 24 hours
    constructor() {
        this.apiKey = config.elevenlabs?.apiKey || '';
        this.voiceId = config.elevenlabs?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default Bella voice
        this.isEnabled = Boolean(this.apiKey);
        this.maxTextLength = config.elevenlabs?.maxTextLength || 5000;
        // Initialize ElevenLabs client
        this.client = this.apiKey ? new ElevenLabsAPI({ apiKey: this.apiKey }) : null;
        // Supported languages for voice synthesis
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar',
            'zh', 'ja', 'hi', 'ko', 'sv', 'da', 'no', 'fi'
        ];
        // Voice settings
        this.defaultSettings = {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
        };
        if (!this.isEnabled) {
            logger.warn('Voice synthesizer disabled: ElevenLabs API key not configured (TypeScript)');
        }
        else {
            logger.info('Voice Synthesizer initialized (TypeScript)', {
                voiceId: this.voiceId,
                maxTextLength: this.maxTextLength
            });
        }
        // Start processing queue
        this.startProcessing();
        // Schedule cleanup every hour
        setInterval(() => {
            this.cleanupOldAudioFiles();
        }, 60 * 60 * 1000);
    }
    /**
     * Synthesize text to speech
     */
    async synthesizeText(text, options = {}) {
        const startTime = performance.now();
        const requestId = `voice_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        try {
            if (!this.isEnabled) {
                throw new Error('Voice synthesis is not enabled. Please configure ElevenLabs API key.');
            }
            // Validate text
            if (!text || text.trim().length === 0) {
                throw new Error('Text cannot be empty.');
            }
            if (text.length > this.maxTextLength) {
                throw new Error(`Text is too long for voice synthesis. Maximum ${this.maxTextLength} characters.`);
            }
            // Clean and prepare text
            const cleanText = this.prepareTextForSynthesis(text);
            // Check cache first
            const cacheKey = this.generateCacheKey(cleanText, options);
            if (this.audioCache.has(cacheKey)) {
                const cachedResult = this.audioCache.get(cacheKey);
                logger.info('Voice synthesis cache hit (TypeScript)', {
                    requestId,
                    textLength: cleanText.length,
                    cacheKey: cacheKey.substring(0, 16) + '...',
                    responseTime: Math.round(performance.now() - startTime)
                });
                return {
                    success: true,
                    data: cachedResult,
                    cached: true,
                    responseTime: Math.round(performance.now() - startTime)
                };
            }
            // Merge options with defaults
            const voiceSettings = { ...this.defaultSettings, ...options };
            // Add to processing queue
            const request = {
                id: requestId,
                text: cleanText,
                options: voiceSettings,
                timestamp: new Date(),
                resolve: null,
                reject: null
            };
            return new Promise((resolve, reject) => {
                request.resolve = resolve;
                request.reject = reject;
                this.requestQueue.push(request);
            });
        }
        catch (error) {
            const responseTime = Math.round(performance.now() - startTime);
            logger.error('Voice synthesis failed (TypeScript)', {
                requestId,
                textLength: text?.length || 0,
                error: error.message,
                responseTime
            });
            return {
                success: false,
                message: error.message,
                responseTime
            };
        }
    }
    /**
     * Process synthesis requests from queue
     */
    startProcessing() {
        setInterval(async () => {
            if (!this.isProcessing && this.requestQueue.length > 0) {
                await this.processQueue();
            }
        }, 100); // Check every 100ms
    }
    /**
     * Process the synthesis queue
     */
    async processQueue() {
        if (!this.isEnabled || this.requestQueue.length === 0)
            return;
        this.isProcessing = true;
        try {
            while (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                if (request) {
                    await this.processSynthesisRequest(request);
                }
                // Rate limiting - ElevenLabs has rate limits
                await this.delay(100);
            }
        }
        catch (error) {
            logger.error('Queue processing failed (TypeScript)', { error: error.message });
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Process individual synthesis request
     */
    async processSynthesisRequest(request) {
        const startTime = performance.now();
        try {
            // Prepare request data
            const requestData = {
                text: request.text,
                voice_settings: request.options
            };
            // Make API call to ElevenLabs
            const audioBuffer = await this.callElevenLabsAPI(requestData);
            // Save audio file
            const filename = `voice_${request.id}.mp3`;
            const audioDir = config.storage?.audioPath || './temp/audio';
            const filePath = path.join(audioDir, filename);
            // Ensure directory exists
            await this.ensureDirectoryExists(path.dirname(filePath));
            // Write audio file
            fs.writeFileSync(filePath, audioBuffer);
            const result = {
                audioFile: filePath,
                filename,
                duration: await this.getAudioDuration(filePath),
                size: audioBuffer.length,
                text: request.text,
                generatedAt: new Date()
            };
            // Cache the result
            const cacheKey = this.generateCacheKey(request.text, request.options);
            this.audioCache.set(cacheKey, result);
            const responseTime = Math.round(performance.now() - startTime);
            logger.info('Voice synthesis successful (TypeScript)', {
                requestId: request.id,
                textLength: request.text.length,
                audioSize: audioBuffer.length,
                duration: result.duration,
                responseTime
            });
            // Resolve the promise
            if (request.resolve) {
                request.resolve({
                    success: true,
                    data: result,
                    cached: false,
                    responseTime
                });
            }
        }
        catch (error) {
            const responseTime = Math.round(performance.now() - startTime);
            logger.error('Voice synthesis request failed (TypeScript)', {
                requestId: request.id,
                error: error.message,
                responseTime
            });
            // Reject the promise
            if (request.reject) {
                request.reject({
                    success: false,
                    message: error.message,
                    responseTime
                });
            }
        }
    }
    /**
     * Call ElevenLabs API using the new client
     */
    async callElevenLabsAPI(requestData) {
        try {
            if (!this.client) {
                throw new Error('ElevenLabs client not initialized');
            }
            // Use the new ElevenLabs client API
            const response = await this.client.textToSpeech(this.voiceId, {
                text: requestData.text,
                model_id: "eleven_multilingual_v2",
                voice_settings: requestData.voice_settings
            });
            // Convert response to buffer
            const audioBuffer = Buffer.from(await response.arrayBuffer());
            return audioBuffer;
        }
        catch (error) {
            throw new Error(`ElevenLabs API error: ${error.message}`);
        }
    }
    /**
     * Prepare text for synthesis
     */
    prepareTextForSynthesis(text) {
        // Remove markdown formatting
        let cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*(.*?)\*/g, '$1') // Italic
            .replace(/`(.*?)`/g, '$1') // Code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
            .replace(/#{1,6}\s/g, '') // Headers
            .replace(/>\s/g, '') // Blockquotes
            .replace(/\n+/g, '. ') // Line breaks to periods
            .replace(/\s+/g, ' ') // Multiple spaces
            .trim();
        // Replace common abbreviations and symbols
        cleanText = cleanText
            .replace(/KES/g, 'Kenya Shillings')
            .replace(/BTC/g, 'Bitcoin')
            .replace(/USD/g, 'US Dollars')
            .replace(/&/g, 'and')
            .replace(/%/g, 'percent')
            .replace(/@/g, 'at')
            .replace(/\+/g, 'plus')
            .replace(/-/g, 'minus')
            .replace(/=/g, 'equals')
            .replace(/₿/g, 'Bitcoin')
            .replace(/KSh/g, 'Kenya Shillings');
        // Ensure proper sentence endings
        if (cleanText && !cleanText.endsWith('.') && !cleanText.endsWith('!') && !cleanText.endsWith('?')) {
            cleanText += '.';
        }
        return cleanText;
    }
    /**
     * Generate cache key for text and options
     */
    generateCacheKey(text, options) {
        const optionsString = JSON.stringify(options);
        const combined = `${text}_${optionsString}_${this.voiceId}`;
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `cache_${Math.abs(hash).toString(36)}`;
    }
    /**
     * Get audio duration (placeholder)
     */
    async getAudioDuration(filePath) {
        // Placeholder - in production, use ffprobe or similar
        try {
            const stats = fs.statSync(filePath);
            // Rough estimate: 1 second per 32KB for MP3
            return Math.round(stats.size / 32000);
        }
        catch {
            return 0;
        }
    }
    /**
     * Ensure directory exists
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }
    /**
     * Get available voices from ElevenLabs
     */
    async getAvailableVoices() {
        if (!this.isEnabled) {
            return {
                success: false,
                message: 'Voice synthesis is not enabled.'
            };
        }
        try {
            const voices = await this.callElevenLabsVoicesAPI();
            return {
                success: true,
                data: {
                    voices: voices.voices.map((voice) => ({
                        id: voice.voice_id,
                        name: voice.name,
                        category: voice.category,
                        description: voice.description,
                        gender: voice.labels?.gender,
                        accent: voice.labels?.accent,
                        age: voice.labels?.age
                    })),
                    currentVoice: this.voiceId
                }
            };
        }
        catch (error) {
            logger.error('Get voices failed (TypeScript)', { error: error.message });
            return {
                success: false,
                message: error.message
            };
        }
    }
    /**
     * Call ElevenLabs voices API using new client
     */
    async callElevenLabsVoicesAPI() {
        try {
            if (!this.client) {
                throw new Error('ElevenLabs client not initialized');
            }
            const voices = await this.client.voices.getAll();
            return { voices: voices.voices };
        }
        catch (error) {
            throw new Error(`Voices request failed: ${error.message}`);
        }
    }
    /**
     * Set voice for synthesis
     */
    setVoice(voiceId) {
        if (!voiceId) {
            return {
                success: false,
                message: 'Voice ID is required.'
            };
        }
        this.voiceId = voiceId;
        logger.info('Voice changed (TypeScript)', { newVoiceId: voiceId });
        return {
            success: true,
            data: {
                voiceId: this.voiceId
            }
        };
    }
    /**
     * Clean up old audio files
     */
    async cleanupOldAudioFiles() {
        try {
            const audioDir = config.storage?.audioPath || './temp/audio';
            if (!fs.existsSync(audioDir)) {
                return;
            }
            const files = fs.readdirSync(audioDir);
            const now = Date.now();
            let cleanedCount = 0;
            for (const file of files) {
                const filePath = path.join(audioDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtime.getTime() > this.fileCleanupAge) {
                        fs.unlinkSync(filePath);
                        cleanedCount++;
                    }
                }
                catch (error) {
                    // File might have been deleted already
                    logger.debug('Error checking file for cleanup (TypeScript)', { file, error: error.message });
                }
            }
            // Clean up cache entries older than cache timeout
            let cacheCleanedCount = 0;
            for (const [key, value] of this.audioCache) {
                if (now - value.generatedAt.getTime() > this.cacheTimeout) {
                    this.audioCache.delete(key);
                    cacheCleanedCount++;
                }
            }
            if (cleanedCount > 0 || cacheCleanedCount > 0) {
                logger.info('Audio cleanup completed (TypeScript)', {
                    filesDeleted: cleanedCount,
                    cacheEntriesDeleted: cacheCleanedCount,
                    remainingCacheSize: this.audioCache.size
                });
            }
        }
        catch (error) {
            logger.error('Audio cleanup failed (TypeScript)', { error: error.message });
        }
    }
    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get voice synthesizer statistics
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            queueLength: this.requestQueue.length,
            cacheSize: this.audioCache.size,
            currentVoice: this.voiceId,
            supportedLanguages: this.supportedLanguages.length,
            isProcessing: this.isProcessing,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Clear all caches and reset queues
     */
    reset() {
        this.requestQueue = [];
        this.audioCache.clear();
        this.isProcessing = false;
        logger.info('Voice synthesizer reset (TypeScript)');
    }
    /**
     * Check if synthesis is available
     */
    isAvailable() {
        return this.isEnabled && Boolean(this.client);
    }
}
// Export singleton instance
export const typedVoiceSynthesizer = new TypedVoiceSynthesizer();
export default typedVoiceSynthesizer;
//# sourceMappingURL=voiceSynthesizer.js.map