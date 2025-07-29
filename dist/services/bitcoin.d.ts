interface PriceData {
    currency: 'USD' | 'KES';
    price: number;
    change24h: number;
    timestamp: string;
    formatted: string;
}
interface BitcoinPriceInfo {
    usd: PriceData;
    kes: PriceData;
    lastUpdated: string;
}
declare class SimplifiedBitcoinService {
    private baseUrl;
    private cache;
    private cacheTimeout;
    private updateInterval;
    private autoUpdateTimer;
    constructor();
    /**
     * Start automatic price updates
     */
    private startAutoUpdate;
    /**
     * Stop automatic price updates
     */
    stopAutoUpdate(): void;
    /**
     * Get current Bitcoin prices (from cache if available)
     */
    getCurrentPrices(): Promise<BitcoinPriceInfo | null>;
    /**
     * Fetch latest Bitcoin prices from CoinGecko
     */
    private fetchLatestPrices;
    /**
     * Get Bitcoin price in specific currency
     */
    getPrice(currency?: 'USD' | 'KES'): Promise<number | null>;
    /**
     * Get formatted Bitcoin price with currency symbol
     */
    getFormattedPrice(currency?: 'USD' | 'KES'): Promise<string | null>;
    /**
     * Get Bitcoin price change in 24 hours
     */
    getPriceChange24h(currency?: 'USD' | 'KES'): Promise<number | null>;
    /**
     * Get price summary for WhatsApp messages
     */
    getPriceSummary(): Promise<string>;
    /**
     * Format price with appropriate currency symbol
     */
    private formatPrice;
    /**
     * Check if service is working properly
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        message: string;
    }>;
    /**
     * Get service statistics
     */
    getStats(): {
        cacheAge: number;
        lastUpdate: string | null;
        autoUpdateEnabled: boolean;
    };
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export declare const simplifiedBitcoinService: SimplifiedBitcoinService;
export default simplifiedBitcoinService;
//# sourceMappingURL=bitcoin.d.ts.map