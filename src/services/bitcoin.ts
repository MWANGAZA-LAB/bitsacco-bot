import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger.js';

/**
 * Simplified Bitcoin Price Service for Bitsacco WhatsApp Assistant
 * TypeScript version focused on price tracking only
 * Fetches Bitcoin prices in USD and KES from CoinGecko
 * 
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration (Simplified)
 */

interface BitcoinPriceResponse {
  bitcoin: {
    usd: number;
    kes: number;
    usd_24h_change: number;
    kes_24h_change: number;
    usd_market_cap: number;
    usd_24h_vol: number;
  };
}

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

class SimplifiedBitcoinService {
  private baseUrl: string = 'https://api.coingecko.com/api/v3';
  private cache: { data: BitcoinPriceInfo | null; timestamp: number } = { data: null, timestamp: 0 };
  private cacheTimeout: number = parseInt(process.env['BITCOIN_PRICE_CACHE_TTL'] || '300') * 1000; // 5 minutes default
  private updateInterval: number = parseInt(process.env['BITCOIN_PRICE_UPDATE_INTERVAL'] || '60') * 1000; // 1 minute default
  private autoUpdateTimer: NodeJS.Timeout | null = null;

  constructor() {
    logger.info('Simplified Bitcoin Price Service initialized');
    this.startAutoUpdate();
  }

  /**
   * Start automatic price updates
   */
  private startAutoUpdate(): void {
    this.autoUpdateTimer = setInterval(async () => {
      try {
        await this.fetchLatestPrices();
        logger.debug('Auto-updated Bitcoin prices');
      } catch (error: any) {
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
  public stopAutoUpdate(): void {
    if (this.autoUpdateTimer) {
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
      logger.info('Bitcoin price auto-update stopped');
    }
  }

  /**
   * Get current Bitcoin prices (from cache if available)
   */
  public async getCurrentPrices(): Promise<BitcoinPriceInfo | null> {
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
  private async fetchLatestPrices(): Promise<BitcoinPriceInfo | null> {
    try {
      logger.debug('Fetching Bitcoin prices from CoinGecko');

      const response: AxiosResponse<BitcoinPriceResponse> = await axios.get(
        `${this.baseUrl}/simple/price`,
        {
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd,kes',
            include_24hr_change: true,
            include_market_cap: true,
            include_24hr_vol: true
          },
          timeout: 10000
        }
      );

      const data = response.data.bitcoin;
      const timestamp = new Date().toISOString();

      const priceInfo: BitcoinPriceInfo = {
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

    } catch (error: any) {
      logger.error('Failed to fetch Bitcoin prices:', error.message);
      return this.cache.data; // Return cached data if available
    }
  }

  /**
   * Get Bitcoin price in specific currency
   */
  public async getPrice(currency: 'USD' | 'KES' = 'USD'): Promise<number | null> {
    const prices = await this.getCurrentPrices();
    if (!prices) return null;

    return currency === 'USD' ? prices.usd.price : prices.kes.price;
  }

  /**
   * Get formatted Bitcoin price with currency symbol
   */
  public async getFormattedPrice(currency: 'USD' | 'KES' = 'USD'): Promise<string | null> {
    const prices = await this.getCurrentPrices();
    if (!prices) return null;

    return currency === 'USD' ? prices.usd.formatted : prices.kes.formatted;
  }

  /**
   * Get Bitcoin price change in 24 hours
   */
  public async getPriceChange24h(currency: 'USD' | 'KES' = 'USD'): Promise<number | null> {
    const prices = await this.getCurrentPrices();
    if (!prices) return null;

    return currency === 'USD' ? prices.usd.change24h : prices.kes.change24h;
  }

  /**
   * Get price summary for WhatsApp messages
   */
  public async getPriceSummary(): Promise<string> {
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
  private formatPrice(price: number, currency: 'USD' | 'KES'): string {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    } else {
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
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const prices = await this.getCurrentPrices();
      
      if (prices && prices.usd.price > 0 && prices.kes.price > 0) {
        return {
          status: 'healthy',
          message: `Bitcoin service operational. Last update: ${prices.lastUpdated}`
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Bitcoin service unable to fetch valid prices'
        };
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Bitcoin service error: ${error.message}`
      };
    }
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    cacheAge: number;
    lastUpdate: string | null;
    autoUpdateEnabled: boolean;
  } {
    return {
      cacheAge: this.cache.timestamp > 0 ? Date.now() - this.cache.timestamp : 0,
      lastUpdate: this.cache.data?.lastUpdated || null,
      autoUpdateEnabled: this.autoUpdateTimer !== null
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAutoUpdate();
    this.cache = { data: null, timestamp: 0 };
    logger.info('Bitcoin service cleaned up');
  }
}

// Export singleton instance
export const simplifiedBitcoinService = new SimplifiedBitcoinService();
export default simplifiedBitcoinService;
