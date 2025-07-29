import axios from 'axios';
import logger from '../utils/logger.js';
class SimplifiedBitcoinService {
    baseUrl = 'https://api.coingecko.com/api/v3';
    cache = { data: null, timestamp: 0 };
    cacheTimeout = parseInt(process.env['BITCOIN_PRICE_CACHE_TTL'] || '300') * 1000; // 5 minutes default
    updateInterval = parseInt(process.env['BITCOIN_PRICE_UPDATE_INTERVAL'] || '60') * 1000; // 1 minute default
    autoUpdateTimer = null;
    constructor() {
        logger.info('Simplified Bitcoin Price Service initialized');
        this.startAutoUpdate();
    }
    /**
     * Start automatic price updates
     */
    startAutoUpdate() {
        this.autoUpdateTimer = setInterval(async () => {
            try {
                await this.fetchLatestPrices();
                logger.debug('Auto-updated Bitcoin prices');
            }
            catch (error) {
                logger.error('Failed to auto-update Bitcoin prices:', error.message);
            }
        }, this.updateInterval);
        // Initial fetch
        this.fetchLatestPrices().catch(error => {
            logger.error('Failed initial Bitcoin price fetch:', error.message);
        });
    }
    /**
     * Stop automatic price updates
     */
    stopAutoUpdate() {
        if (this.autoUpdateTimer) {
            clearInterval(this.autoUpdateTimer);
            this.autoUpdateTimer = null;
            logger.info('Bitcoin price auto-update stopped');
        }
    }
    /**
     * Get current Bitcoin prices (from cache if available)
     */
    async getCurrentPrices() {
        // Return cached data if still fresh
        if (this.cache.data && (Date.now() - this.cache.timestamp) < this.cacheTimeout) {
            return this.cache.data;
        }
        // Fetch fresh data
        return await this.fetchLatestPrices();
    }
    /**
     * Fetch latest Bitcoin prices from CoinGecko
     */
    async fetchLatestPrices() {
        try {
            logger.debug('Fetching Bitcoin prices from CoinGecko');
            const response = await axios.get(`${this.baseUrl}/simple/price`, {
                params: {
                    ids: 'bitcoin',
                    vs_currencies: 'usd,kes',
                    include_24hr_change: true,
                    include_market_cap: true,
                    include_24hr_vol: true
                },
                timeout: 10000
            });
            const data = response.data.bitcoin;
            const timestamp = new Date().toISOString();
            const priceInfo = {
                usd: {
                    currency: 'USD',
                    price: data.usd,
                    change24h: data.usd_24h_change || 0,
                    timestamp,
                    formatted: this.formatPrice(data.usd, 'USD')
                },
                kes: {
                    currency: 'KES',
                    price: data.kes,
                    change24h: data.kes_24h_change || 0,
                    timestamp,
                    formatted: this.formatPrice(data.kes, 'KES')
                },
                lastUpdated: timestamp
            };
            // Update cache
            this.cache = {
                data: priceInfo,
                timestamp: Date.now()
            };
            logger.info('Bitcoin prices updated successfully', {
                usd: priceInfo.usd.formatted,
                kes: priceInfo.kes.formatted
            });
            return priceInfo;
        }
        catch (error) {
            logger.error('Failed to fetch Bitcoin prices:', error.message);
            return this.cache.data; // Return cached data if available
        }
    }
    /**
     * Get Bitcoin price in specific currency
     */
    async getPrice(currency = 'USD') {
        const prices = await this.getCurrentPrices();
        if (!prices)
            return null;
        return currency === 'USD' ? prices.usd.price : prices.kes.price;
    }
    /**
     * Get formatted Bitcoin price with currency symbol
     */
    async getFormattedPrice(currency = 'USD') {
        const prices = await this.getCurrentPrices();
        if (!prices)
            return null;
        return currency === 'USD' ? prices.usd.formatted : prices.kes.formatted;
    }
    /**
     * Get Bitcoin price change in 24 hours
     */
    async getPriceChange24h(currency = 'USD') {
        const prices = await this.getCurrentPrices();
        if (!prices)
            return null;
        return currency === 'USD' ? prices.usd.change24h : prices.kes.change24h;
    }
    /**
     * Get price summary for WhatsApp messages
     */
    async getPriceSummary() {
        const prices = await this.getCurrentPrices();
        if (!prices) {
            return '❌ Unable to fetch Bitcoin prices at the moment. Please try again later.';
        }
        const usdChange = prices.usd.change24h >= 0 ? '📈' : '📉';
        const kesChange = prices.kes.change24h >= 0 ? '📈' : '📉';
        return `💰 *Bitcoin Price Update*

🇺🇸 *USD*: ${prices.usd.formatted}
${usdChange} 24h Change: ${prices.usd.change24h.toFixed(2)}%

🇰🇪 *KES*: ${prices.kes.formatted}  
${kesChange} 24h Change: ${prices.kes.change24h.toFixed(2)}%

⏰ Last updated: ${new Date(prices.lastUpdated).toLocaleTimeString()}`;
    }
    /**
     * Format price with appropriate currency symbol
     */
    formatPrice(price, currency) {
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(price);
        }
        else {
            return new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(price);
        }
    }
    /**
     * Check if service is working properly
     */
    async healthCheck() {
        try {
            const prices = await this.getCurrentPrices();
            if (prices && prices.usd.price > 0 && prices.kes.price > 0) {
                return {
                    status: 'healthy',
                    message: `Bitcoin service operational. Last update: ${prices.lastUpdated}`
                };
            }
            else {
                return {
                    status: 'unhealthy',
                    message: 'Bitcoin service unable to fetch valid prices'
                };
            }
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Bitcoin service error: ${error.message}`
            };
        }
    }
    /**
     * Get service statistics
     */
    getStats() {
        return {
            cacheAge: this.cache.timestamp > 0 ? Date.now() - this.cache.timestamp : 0,
            lastUpdate: this.cache.data?.lastUpdated || null,
            autoUpdateEnabled: this.autoUpdateTimer !== null
        };
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopAutoUpdate();
        this.cache = { data: null, timestamp: 0 };
        logger.info('Bitcoin service cleaned up');
    }
}
// Export singleton instance
export const simplifiedBitcoinService = new SimplifiedBitcoinService();
export default simplifiedBitcoinService;
//# sourceMappingURL=bitcoin.js.map