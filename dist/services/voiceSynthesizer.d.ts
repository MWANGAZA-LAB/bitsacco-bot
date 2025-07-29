/**
 * Voice Synthesizer Service Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Optional audio responses using ElevenLabs TTS
 * Following the exact design document specifications
 *
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */
interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
}
interface SynthesisOptions extends Partial<VoiceSettings> {
    language?: string;
    model?: string;
}
interface AudioResult {
    audioFile: string;
    filename: string;
    duration: number;
    size: number;
    text: string;
    generatedAt: Date;
}
interface SynthesisResult {
    success: boolean;
    data?: AudioResult;
    cached?: boolean;
    responseTime: number;
    message?: string;
}
interface VoiceInfo {
    id: string;
    name: string;
    category: string;
    description: string;
    gender?: string;
    accent?: string;
    age?: string;
}
interface VoicesResponse {
    success: boolean;
    data?: {
        voices: VoiceInfo[];
        currentVoice: string;
    };
    message?: string;
}
interface SetVoiceResult {
    success: boolean;
    data?: {
        voiceId: string;
    };
    message?: string;
}
interface VoiceStats {
    isEnabled: boolean;
    queueLength: number;
    cacheSize: number;
    currentVoice: string;
    supportedLanguages: number;
    isProcessing: boolean;
    timestamp: string;
}
declare class TypedVoiceSynthesizer {
    private apiKey;
    private voiceId;
    private audioCache;
    private isEnabled;
    private requestQueue;
    private isProcessing;
    private client;
    private supportedLanguages;
    private defaultSettings;
    private maxTextLength;
    private cacheTimeout;
    private fileCleanupAge;
    constructor();
    /**
     * Synthesize text to speech
     */
    synthesizeText(text: string, options?: SynthesisOptions): Promise<SynthesisResult>;
    /**
     * Process synthesis requests from queue
     */
    private startProcessing;
    /**
     * Process the synthesis queue
     */
    private processQueue;
    /**
     * Process individual synthesis request
     */
    private processSynthesisRequest;
    /**
     * Call ElevenLabs API using the new client
     */
    private callElevenLabsAPI;
    /**
     * Prepare text for synthesis
     */
    private prepareTextForSynthesis;
    /**
     * Generate cache key for text and options
     */
    private generateCacheKey;
    /**
     * Get audio duration (placeholder)
     */
    private getAudioDuration;
    /**
     * Ensure directory exists
     */
    private ensureDirectoryExists;
    /**
     * Get available voices from ElevenLabs
     */
    getAvailableVoices(): Promise<VoicesResponse>;
    /**
     * Call ElevenLabs voices API using new client
     */
    private callElevenLabsVoicesAPI;
    /**
     * Set voice for synthesis
     */
    setVoice(voiceId: string): SetVoiceResult;
    /**
     * Clean up old audio files
     */
    cleanupOldAudioFiles(): Promise<void>;
    /**
     * Delay utility
     */
    private delay;
    /**
     * Get voice synthesizer statistics
     */
    getStats(): VoiceStats;
    /**
     * Clear all caches and reset queues
     */
    reset(): void;
    /**
     * Check if synthesis is available
     */
    isAvailable(): boolean;
}
export declare const typedVoiceSynthesizer: TypedVoiceSynthesizer;
export default typedVoiceSynthesizer;
//# sourceMappingURL=voiceSynthesizer.d.ts.map