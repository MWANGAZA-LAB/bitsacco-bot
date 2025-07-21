import axios from 'axios';
import QRCode from 'qrcode';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class BitcoinService {
  constructor() {
    this.lightningConfig = config.bitcoin.lightning;
    this.rpcConfig = config.bitcoin.rpc;
  }

  // Generate Lightning invoice
  async createLightningInvoice(amount, description = 'Bitsacco Payment', expiry = 3600) {
    try {
      // Mock Lightning invoice for demo - replace with actual Lightning node integration
      const invoiceData = {
        payment_request: this.generateMockInvoice(amount),
        r_hash: this.generateRandomHash(),
        add_index: Date.now(),
        payment_addr: this.generateRandomHash(),
        creation_date: Math.floor(Date.now() / 1000),
        description,
        expiry,
        value: amount,
        settled: false
      };

      logger.info(`Lightning invoice created for ${amount} sats`);
      return invoiceData;
    } catch (error) {
      logger.error('Failed to create Lightning invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  // Generate QR code for payment
  async generatePaymentQR(paymentRequest) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(paymentRequest, {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Send Lightning payment
  async sendLightningPayment(paymentRequest, amount = null) {
    try {
      // Mock payment sending - replace with actual Lightning node integration
      const paymentResult = {
        payment_preimage: this.generateRandomHash(),
        payment_route: {
          total_time_lock: 144,
          total_fees: '1',
          total_amt: amount || '1000',
          hops: []
        },
        payment_hash: this.generateRandomHash(),
        payment_index: Date.now(),
        creation_date: Math.floor(Date.now() / 1000),
        fee: '1',
        value: amount || '1000',
        status: 'SUCCEEDED'
      };

      logger.info(`Lightning payment sent: ${amount || 'unknown'} sats`);
      return paymentResult;
    } catch (error) {
      logger.error('Failed to send Lightning payment:', error);
      throw new Error('Payment failed');
    }
  }

  // Check Lightning invoice status
  async checkInvoiceStatus(paymentHash) {
    try {
      // Mock invoice checking - replace with actual Lightning node integration
      const invoiceStatus = {
        settled: Math.random() > 0.5, // Random for demo
        creation_date: Math.floor(Date.now() / 1000),
        settle_date: Math.random() > 0.5 ? Math.floor(Date.now() / 1000) : 0,
        payment_request: this.generateMockInvoice(1000),
        description: 'Bitsacco Payment',
        value: '1000',
        settled_amt: '1000'
      };

      return invoiceStatus;
    } catch (error) {
      logger.error('Failed to check invoice status:', error);
      throw new Error('Failed to check invoice status');
    }
  }

  // Get wallet balance
  async getWalletBalance() {
    try {
      // Mock balance - replace with actual wallet integration
      const balance = {
        total_balance: Math.floor(Math.random() * 1000000), // Random balance for demo
        confirmed_balance: Math.floor(Math.random() * 1000000),
        unconfirmed_balance: 0
      };

      return balance;
    } catch (error) {
      logger.error('Failed to get wallet balance:', error);
      throw new Error('Failed to get balance');
    }
  }

  // Get current Bitcoin price
  async getBitcoinPrice(currency = 'USD') {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`);
      return response.data.bitcoin[currency.toLowerCase()];
    } catch (error) {
      logger.error('Failed to get Bitcoin price:', error);
      return null;
    }
  }

  // Convert satoshis to Bitcoin
  satsToBTC(sats) {
    return sats / 100000000;
  }

  // Convert Bitcoin to satoshis
  btcToSats(btc) {
    return Math.floor(btc * 100000000);
  }

  // Convert satoshis to fiat currency
  async satsToFiat(sats, currency = 'USD') {
    try {
      const btcPrice = await this.getBitcoinPrice(currency);
      if (!btcPrice) return null;
      
      const btcAmount = this.satsToBTC(sats);
      return btcAmount * btcPrice;
    } catch (error) {
      logger.error('Failed to convert sats to fiat:', error);
      return null;
    }
  }

  // Generate mock Lightning invoice (for demo purposes)
  generateMockInvoice(amount) {
    const prefix = 'lnbc';
    const amountPart = amount ? Math.floor(amount / 1000) + 'u' : '';
    const randomPart = this.generateRandomString(87);
    return `${prefix}${amountPart}1${randomPart}`;
  }

  // Generate random hash (for demo purposes)
  generateRandomHash() {
    return Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Generate random string
  generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // Validate Lightning invoice format
  isValidLightningInvoice(invoice) {
    return /^ln[a-z0-9]+$/i.test(invoice) && invoice.length > 50;
  }

  // Validate Bitcoin address
  isValidBitcoinAddress(address) {
    // Basic validation - in production, use a proper Bitcoin library
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
           /^bc1[a-z0-9]{39,59}$/.test(address);
  }

  // Format amount for display
  formatAmount(sats, currency = 'sats') {
    switch (currency.toLowerCase()) {
      case 'btc':
        return `${this.satsToBTC(sats).toFixed(8)} BTC`;
      case 'sats':
      default:
        return `${sats.toLocaleString()} sats`;
    }
  }
}

export default new BitcoinService();