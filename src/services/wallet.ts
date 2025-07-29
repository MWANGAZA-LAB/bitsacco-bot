import { performance } from 'perf_hooks';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import bitsaccoApi from './bitsaccoApi.js';
import bitcoinService from './bitcoin.js';

/**
 * Wallet Service Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Interfaces with Bitsacco's Bitcoin wallet system
 * Following the exact design document specifications
 * 
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */

interface WalletBalance {
  balanceBtc: number;
  balanceKes: number;
  balanceUsd: number;
  bitcoinPrice: {
    usd: number;
    kes: number;
    lastUpdated: string;
  };
  walletAddress?: string;
  lastUpdated: string;
}

interface BalanceResponse {
  success: boolean;
  data?: WalletBalance;
  source?: 'cache' | 'api';
  responseTime: number;
  message?: string;
}

interface PurchaseTransaction {
  transactionId: string;
  amountKes: number;
  amountBtc: number;
  rate: number;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  estimatedConfirmationTime?: string;
}

interface PurchaseResponse {
  success: boolean;
  data?: PurchaseTransaction;
  message?: string;
  transactionId?: string;
  responseTime: number;
}

interface TransferTransaction {
  transactionId: string;
  amountBtc: number;
  recipient: string;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  estimatedConfirmationTime?: string;
}

interface TransferResponse {
  success: boolean;
  data?: TransferTransaction;
  message?: string;
  transactionId?: string;
  responseTime: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'chama_contribution' | 'goal_savings';
  amountBtc: number;
  amountKes?: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  confirmations?: number;
  txHash?: string;
}

interface TransactionHistoryData {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface TransactionHistoryResponse {
  success: boolean;
  data?: TransactionHistoryData;
  message?: string;
  responseTime: number;
}

interface QueuedTransaction {
  type: 'deposit' | 'transfer';
  userId: string;
  phoneNumber: string;
  amountKes?: number;
  amountBtc?: number;
  estimatedBtc?: number;
  actualBtc?: number;
  toPhoneNumber?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  txHash?: string;
  error?: string;
}

interface CachedWalletData {
  data: WalletBalance;
  timestamp: number;
}

interface MpesaPaymentResult {
  success: boolean;
  paymentReference?: string;
  message: string;
  checkoutRequestId?: string;
}

interface WalletStats {
  cachedWallets: number;
  pendingTransactions: number;
  totalTransactions: number;
  timestamp: string;
}

class TypedWalletService {
  private walletCache: Map<string, CachedWalletData> = new Map();
  private transactionQueue: Map<string, QueuedTransaction> = new Map();
  private cacheTimeout: number = 30000; // 30 seconds
  private transactionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    logger.info('Wallet Service initialized (TypeScript)');
    
    // Schedule cache cleanup every 5 minutes
    setInterval(() => {
      this.clearExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Get user wallet balance (BTC and KES)
   */
  async getBalance(userId: string, phoneNumber: string): Promise<BalanceResponse> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = `balance_${userId}`;
      const cached = this.walletCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return {
          success: true,
          data: cached.data,
          source: 'cache',
          responseTime: Math.round(performance.now() - startTime)
        };
      }

      // Fetch from Bitsacco API
      const walletData = await bitsaccoApi.getBalance(userId);
      
      if (!walletData.success) {
        throw new Error(walletData.message || 'Failed to fetch wallet data');
      }

      // Get current Bitcoin price
      const bitcoinPriceUsd = await bitcoinService.getBitcoinPrice('USD');
      const bitcoinPriceKes = await bitcoinService.getBitcoinPrice('KES');
      
      if (bitcoinPriceUsd === null || bitcoinPriceKes === null) {
        throw new Error('Failed to fetch current Bitcoin price');
      }

      const balanceData: WalletBalance = {
        balanceBtc: walletData.btcBalance || 0,
        balanceKes: walletData.balance || 0,
        balanceUsd: (walletData.btcBalance || 0) * bitcoinPriceUsd,
        bitcoinPrice: {
          usd: bitcoinPriceUsd,
          kes: bitcoinPriceKes,
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.walletCache.set(cacheKey, {
        data: balanceData,
        timestamp: Date.now()
      });

      const responseTime = Math.round(performance.now() - startTime);
      
      logger.info('Balance retrieved successfully (TypeScript)', {
        userId,
        balanceBtc: balanceData.balanceBtc,
        balanceKes: balanceData.balanceKes,
        responseTime
      });

      return {
        success: true,
        data: balanceData,
        source: 'api',
        responseTime
      };

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      
      logger.error('Balance retrieval failed (TypeScript)', {
        userId,
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
   * Save Bitcoin with M-Pesa
   * Converts KES to Bitcoin for SACCO savings account
   */
  async saveBitcoin(userId: string, phoneNumber: string, amountKes: number): Promise<PurchaseResponse> {
    const startTime = performance.now();
    const transactionId = `save_${Date.now()}_${userId.substring(0, 8)}`;
    
    try {
      // Validate amount
      if (!amountKes || amountKes <= 0) {
        throw new Error('Invalid amount. Amount must be greater than 0.');
      }

      if (amountKes < 100) {
        throw new Error('Minimum purchase amount is KES 100.');
      }

      // Check daily limits
      const dailyLimit = this.getDailyLimit(userId);
      if (amountKes > dailyLimit) {
        throw new Error(`Purchase amount exceeds daily limit of KES ${dailyLimit.toLocaleString()}.`);
      }

      // Get current Bitcoin price
      const bitcoinPriceKes = await bitcoinService.getBitcoinPrice('KES');
      if (bitcoinPriceKes === null) {
        throw new Error('Failed to get current Bitcoin price');
      }
      
      const estimatedBtc = amountKes / bitcoinPriceKes;

      // Add to transaction queue
      this.transactionQueue.set(transactionId, {
        type: 'deposit',
        userId,
        phoneNumber,
        amountKes,
        estimatedBtc,
        status: 'pending',
        createdAt: new Date()
      });

      // Initiate M-Pesa payment
      const mpesaResult = await this.initiateMpesaPayment(phoneNumber, amountKes, transactionId);
      
      if (!mpesaResult.success) {
        this.transactionQueue.delete(transactionId);
        throw new Error(mpesaResult.message || 'M-Pesa payment failed');
      }

      // Process Bitcoin purchase through Bitsacco API
      const purchaseResult = await bitsaccoApi.purchaseBitcoin(userId, amountKes);

      if (!purchaseResult.success) {
        this.transactionQueue.delete(transactionId);
        throw new Error(purchaseResult.message || 'Bitcoin purchase failed');
      }

      // Update transaction status
      const transaction = this.transactionQueue.get(transactionId);
      if (transaction) {
        transaction.status = 'completed';
        transaction.actualBtc = purchaseResult.btcAmount;
        transaction.completedAt = new Date();
      }

      // Clear wallet cache
      this.walletCache.delete(`balance_${userId}`);

      const responseTime = Math.round(performance.now() - startTime);
      
      logger.info('Bitcoin purchase completed (TypeScript)', {
        userId,
        transactionId,
        amountKes,
        actualBtc: purchaseResult.btcAmount,
        responseTime
      });

      return {
        success: true,
        data: {
          transactionId,
          amountKes,
          amountBtc: purchaseResult.btcAmount || estimatedBtc,
          rate: bitcoinPriceKes,
          status: 'completed',
          estimatedConfirmationTime: '10-30 minutes'
        },
        responseTime
      };

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      
      // Clean up failed transaction
      if (this.transactionQueue.has(transactionId)) {
        const transaction = this.transactionQueue.get(transactionId)!;
        transaction.status = 'failed';
        transaction.error = error.message;
        transaction.failedAt = new Date();
      }

      logger.error('Bitcoin purchase failed (TypeScript)', {
        userId,
        transactionId,
        amountKes,
        error: error.message,
        responseTime
      });

      return {
        success: false,
        message: error.message,
        transactionId,
        responseTime
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string, 
    phoneNumber: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<TransactionHistoryResponse> {
    const startTime = performance.now();
    
    try {
      // Fetch from Bitsacco API
      const historyData = await bitsaccoApi.getTransactionHistory(userId, Math.floor(offset / limit) + 1, limit);
      
      if (!historyData.success) {
        throw new Error(historyData.message || 'Failed to fetch transaction history');
      }

      // Format transactions for display
      const formattedTransactions: Transaction[] = historyData.transactions.map(tx => ({
        id: tx.transactionId,
        type: tx.type,
        amountBtc: tx.btcAmount || 0,
        amountKes: tx.amount,
        status: tx.status,
        date: tx.date,
        description: this.getTransactionDescription({
          type: tx.type,
          amountBtc: tx.btcAmount || 0,
          amountKes: tx.amount
        }),
        confirmations: 6, // Mock confirmation count
        txHash: tx.transactionId
      }));

      const responseTime = Math.round(performance.now() - startTime);
      
      logger.info('Transaction history retrieved (TypeScript)', {
        userId,
        count: formattedTransactions.length,
        limit,
        offset,
        responseTime
      });

      return {
        success: true,
        data: {
          transactions: formattedTransactions,
          total: historyData.totalCount,
          limit,
          offset,
          hasMore: historyData.totalCount > (offset + limit)
        },
        responseTime
      };

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      
      logger.error('Transaction history retrieval failed (TypeScript)', {
        userId,
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
   * Transfer Bitcoin to another user
   */
  async transferBitcoin(
    fromUserId: string, 
    fromPhoneNumber: string, 
    toPhoneNumber: string, 
    amountBtc: number
  ): Promise<TransferResponse> {
    const startTime = performance.now();
    const transactionId = `transfer_${Date.now()}_${fromUserId.substring(0, 8)}`;
    
    try {
      // Validate amount
      if (!amountBtc || amountBtc <= 0) {
        throw new Error('Invalid amount. Amount must be greater than 0.');
      }

      // Check minimum transfer amount
      if (amountBtc < 0.00001) {
        throw new Error('Minimum transfer amount is 0.00001 BTC.');
      }

      // Validate recipient phone number
      if (!this.isValidPhoneNumber(toPhoneNumber)) {
        throw new Error('Invalid recipient phone number.');
      }

      // Check sender balance
      const balanceResult = await this.getBalance(fromUserId, fromPhoneNumber);
      if (!balanceResult.success || !balanceResult.data || balanceResult.data.balanceBtc < amountBtc) {
        throw new Error('Insufficient balance for transfer.');
      }

      // Add to transaction queue
      this.transactionQueue.set(transactionId, {
        type: 'transfer',
        userId: fromUserId,
        phoneNumber: fromPhoneNumber,
        toPhoneNumber,
        amountBtc,
        status: 'pending',
        createdAt: new Date()
      });

      // For now, simulate transfer completion
      // In production, this would call the Bitsacco API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTxHash = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Update transaction status
      const transaction = this.transactionQueue.get(transactionId);
      if (transaction) {
        transaction.status = 'completed';
        transaction.txHash = mockTxHash;
        transaction.completedAt = new Date();
      }

      // Clear wallet caches
      this.walletCache.delete(`balance_${fromUserId}`);

      const responseTime = Math.round(performance.now() - startTime);
      
      logger.info('Bitcoin transfer completed (TypeScript)', {
        fromUserId,
        fromPhoneNumber: this.maskPhoneNumber(fromPhoneNumber),
        toPhoneNumber: this.maskPhoneNumber(toPhoneNumber),
        amountBtc,
        transactionId,
        txHash: mockTxHash,
        responseTime
      });

      return {
        success: true,
        data: {
          transactionId,
          amountBtc,
          recipient: this.maskPhoneNumber(toPhoneNumber),
          txHash: mockTxHash,
          status: 'completed',
          estimatedConfirmationTime: '10-30 minutes'
        },
        responseTime
      };

    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      
      // Clean up failed transaction
      if (this.transactionQueue.has(transactionId)) {
        const transaction = this.transactionQueue.get(transactionId)!;
        transaction.status = 'failed';
        transaction.error = error.message;
        transaction.failedAt = new Date();
      }

      logger.error('Bitcoin transfer failed (TypeScript)', {
        fromUserId,
        transactionId,
        amountBtc,
        error: error.message,
        responseTime
      });

      return {
        success: false,
        message: error.message,
        transactionId,
        responseTime
      };
    }
  }

  /**
   * Get daily transaction limit based on user KYC level
   */
  getDailyLimit(userId: string): number {
    // Placeholder implementation - in production, fetch from user KYC data
    // Default to Tier 1 limit
    return config.business?.transactionLimits?.daily?.tier1 || 50000;
  }

  /**
   * Initiate M-Pesa payment
   */
  private async initiateMpesaPayment(phoneNumber: string, amount: number, transactionId: string): Promise<MpesaPaymentResult> {
    try {
      logger.info('Initiating M-Pesa payment (TypeScript)', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        amount,
        transactionId
      });

      // Simulate M-Pesa payment process
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        paymentReference: `MP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        message: 'M-Pesa payment initiated. Please complete payment on your phone.',
        checkoutRequestId: `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      };

    } catch (error: any) {
      logger.error('M-Pesa payment initiation failed (TypeScript)', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        amount,
        transactionId,
        error: error.message
      });

      return {
        success: false,
        message: 'Failed to initiate M-Pesa payment'
      };
    }
  }

  /**
   * Get transaction description for display
   */
  private getTransactionDescription(transaction: { type: string; amountBtc: number; amountKes?: number }): string {
    switch (transaction.type) {
      case 'deposit':
      case 'bitcoin_purchase':
        return `Bought ${transaction.amountBtc.toFixed(8)} BTC${transaction.amountKes ? ` for KES ${transaction.amountKes}` : ''}`;
      case 'withdrawal':
      case 'bitcoin_sale':
        return `Sold ${transaction.amountBtc.toFixed(8)} BTC${transaction.amountKes ? ` for KES ${transaction.amountKes}` : ''}`;
      case 'transfer':
        return `Received ${transaction.amountBtc.toFixed(8)} BTC`;
      case 'transfer_out':
        return `Sent ${transaction.amountBtc.toFixed(8)} BTC`;
      case 'chama_contribution':
        return `Chama contribution: ${transaction.amountBtc.toFixed(8)} BTC`;
      case 'goal_savings':
        return `Goal savings: ${transaction.amountBtc.toFixed(8)} BTC`;
      default:
        return `${transaction.type}: ${transaction.amountBtc.toFixed(8)} BTC`;
    }
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    const kenyanPhoneRegex = /^(\+254|254|0)(7|1)\d{8}$/;
    return kenyanPhoneRegex.test(phoneNumber);
  }

  /**
   * Mask phone number for privacy
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) return '****';
    return phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(phoneNumber.length - 3);
  }

  /**
   * Format BTC amount for display
   */
  formatBtcAmount(btcAmount: number): string {
    return parseFloat(btcAmount.toString()).toFixed(8) + ' BTC';
  }

  /**
   * Format KES amount for display
   */
  formatKesAmount(kesAmount: number): string {
    return 'KES ' + parseFloat(kesAmount.toString()).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Get wallet statistics
   */
  getStats(): WalletStats {
    return {
      cachedWallets: this.walletCache.size,
      pendingTransactions: Array.from(this.transactionQueue.values())
        .filter(tx => tx.status === 'pending').length,
      totalTransactions: this.transactionQueue.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, value] of this.walletCache) {
      if (now - value.timestamp > cacheTimeout) {
        this.walletCache.delete(key);
      }
    }

    // Clean up old completed transactions
    for (const [key, value] of this.transactionQueue) {
      if (value.status !== 'pending' && now - new Date(value.createdAt).getTime() > this.transactionTimeout) {
        this.transactionQueue.delete(key);
      }
    }
    
    logger.debug('Cache cleanup completed (TypeScript)', {
      remainingCacheEntries: this.walletCache.size,
      remainingTransactions: this.transactionQueue.size
    });
  }
}

// Export singleton instance
export const typedWalletService = new TypedWalletService();
export default typedWalletService;
