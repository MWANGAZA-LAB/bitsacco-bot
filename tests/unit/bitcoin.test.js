import { jest } from '@jest/globals';
import bitcoinService from '../../src/services/bitcoin.js';

// Mock axios for external API calls
jest.mock('axios');

describe('Bitcoin Service', () => {
  describe('Lightning Invoice Generation', () => {
    test('should create lightning invoice with correct amount', async () => {
      const amount = 1000;
      const description = 'Test Payment';
      
      const invoice = await bitcoinService.createLightningInvoice(amount, description);
      
      expect(invoice).toHaveProperty('payment_request');
      expect(invoice).toHaveProperty('r_hash');
      expect(invoice).toHaveProperty('value', amount);
      expect(invoice).toHaveProperty('description', description);
      expect(invoice.settled).toBe(false);
    });

    test('should generate valid lightning invoice format', async () => {
      const invoice = await bitcoinService.createLightningInvoice(1000);
      
      expect(bitcoinService.isValidLightningInvoice(invoice.payment_request)).toBe(true);
      expect(invoice.payment_request).toMatch(/^lnbc/);
    });

    test('should handle different amounts correctly', async () => {
      const amounts = [100, 1000, 10000, 100000];
      
      for (const amount of amounts) {
        const invoice = await bitcoinService.createLightningInvoice(amount);
        expect(invoice.value).toBe(amount);
      }
    });
  });

  describe('QR Code Generation', () => {
    test('should generate QR code for payment request', async () => {
      const paymentRequest = 'lnbc1000u1p0example';
      
      const qrCode = await bitcoinService.generatePaymentQR(paymentRequest);
      
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
      expect(qrCode.length).toBeGreaterThan(100); // Base64 encoded image should be substantial
    });

    test('should handle empty payment request gracefully', async () => {
      await expect(bitcoinService.generatePaymentQR('')).rejects.toThrow();
    });
  });

  describe('Payment Processing', () => {
    test('should process lightning payment successfully', async () => {
      const paymentRequest = 'lnbc1000u1p0example';
      const amount = 1000;
      
      const result = await bitcoinService.sendLightningPayment(paymentRequest, amount);
      
      expect(result).toHaveProperty('payment_preimage');
      expect(result).toHaveProperty('payment_hash');
      expect(result).toHaveProperty('status', 'SUCCEEDED');
      expect(result.value).toBe(amount.toString());
    });

    test('should handle payment failure', async () => {
      const invalidPaymentRequest = 'invalid_request';
      
      await expect(bitcoinService.sendLightningPayment(invalidPaymentRequest))
        .rejects.toThrow('Payment failed');
    });
  });

  describe('Balance Management', () => {
    test('should return wallet balance', async () => {
      const balance = await bitcoinService.getWalletBalance();
      
      expect(balance).toHaveProperty('total_balance');
      expect(balance).toHaveProperty('confirmed_balance');
      expect(balance).toHaveProperty('unconfirmed_balance');
      expect(typeof balance.total_balance).toBe('number');
      expect(balance.total_balance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Price Fetching', () => {
    test('should fetch Bitcoin price in USD', async () => {
      // Mock successful API response
      const mockPrice = 45000;
      const mockAxios = await import('axios');
      mockAxios.default.get.mockResolvedValue({
        data: { bitcoin: { usd: mockPrice } }
      });

      const price = await bitcoinService.getBitcoinPrice('USD');
      
      expect(price).toBe(mockPrice);
      expect(mockAxios.default.get).toHaveBeenCalledWith(
        expect.stringContaining('coingecko.com')
      );
    });

    test('should handle API failure gracefully', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.get.mockRejectedValue(new Error('API Error'));

      const price = await bitcoinService.getBitcoinPrice('USD');
      
      expect(price).toBeNull();
    });

    test('should fetch price in different currencies', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.get.mockResolvedValue({
        data: { bitcoin: { eur: 38000 } }
      });

      const price = await bitcoinService.getBitcoinPrice('EUR');
      
      expect(price).toBe(38000);
    });
  });

  describe('Unit Conversions', () => {
    test('should convert satoshis to BTC correctly', () => {
      expect(bitcoinService.satsToBTC(100000000)).toBe(1);
      expect(bitcoinService.satsToBTC(50000000)).toBe(0.5);
      expect(bitcoinService.satsToBTC(1000)).toBe(0.00001);
    });

    test('should convert BTC to satoshis correctly', () => {
      expect(bitcoinService.btcToSats(1)).toBe(100000000);
      expect(bitcoinService.btcToSats(0.5)).toBe(50000000);
      expect(bitcoinService.btcToSats(0.00001)).toBe(1000);
    });

    test('should convert sats to fiat currency', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.get.mockResolvedValue({
        data: { bitcoin: { usd: 50000 } }
      });

      const fiatValue = await bitcoinService.satsToFiat(100000000, 'USD'); // 1 BTC
      
      expect(fiatValue).toBe(50000);
    });

    test('should handle fiat conversion failure', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.get.mockRejectedValue(new Error('API Error'));

      const fiatValue = await bitcoinService.satsToFiat(100000000, 'USD');
      
      expect(fiatValue).toBeNull();
    });
  });

  describe('Address and Invoice Validation', () => {
    test('should validate lightning invoices correctly', () => {
      const validInvoices = [
        'lnbc1000u1p0example',
        'lnbc100n1p0example123',
        'lntb1000u1p0example'
      ];
      
      const invalidInvoices = [
        'invalid_invoice',
        'bc1qexample',
        '',
        'lnbc' // too short
      ];

      validInvoices.forEach(invoice => {
        expect(bitcoinService.isValidLightningInvoice(invoice)).toBe(true);
      });

      invalidInvoices.forEach(invoice => {
        expect(bitcoinService.isValidLightningInvoice(invoice)).toBe(false);
      });
    });

    test('should validate Bitcoin addresses correctly', () => {
      const validAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // Bech32
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' // P2SH
      ];
      
      const invalidAddresses = [
        'invalid_address',
        'lnbc1000u1p0example',
        '',
        '1InvalidAddress'
      ];

      validAddresses.forEach(address => {
        expect(bitcoinService.isValidBitcoinAddress(address)).toBe(true);
      });

      invalidAddresses.forEach(address => {
        expect(bitcoinService.isValidBitcoinAddress(address)).toBe(false);
      });
    });
  });

  describe('Amount Formatting', () => {
    test('should format amounts in satoshis', () => {
      expect(bitcoinService.formatAmount(1000, 'sats')).toBe('1,000 sats');
      expect(bitcoinService.formatAmount(1000000, 'sats')).toBe('1,000,000 sats');
    });

    test('should format amounts in BTC', () => {
      expect(bitcoinService.formatAmount(100000000, 'btc')).toBe('1.00000000 BTC');
      expect(bitcoinService.formatAmount(50000000, 'btc')).toBe('0.50000000 BTC');
    });

    test('should default to sats format', () => {
      expect(bitcoinService.formatAmount(1000)).toBe('1,000 sats');
    });
  });

  describe('Invoice Status Checking', () => {
    test('should check invoice payment status', async () => {
      const paymentHash = 'example_hash';
      
      const status = await bitcoinService.checkInvoiceStatus(paymentHash);
      
      expect(status).toHaveProperty('settled');
      expect(status).toHaveProperty('creation_date');
      expect(status).toHaveProperty('payment_request');
      expect(typeof status.settled).toBe('boolean');
    });
  });

  describe('Mock Data Generation', () => {
    test('should generate valid mock invoice format', () => {
      const amount = 1000;
      const invoice = bitcoinService.generateMockInvoice(amount);
      
      expect(invoice).toMatch(/^lnbc/);
      expect(invoice).toContain('1u1'); // Amount encoding
      expect(invoice.length).toBeGreaterThan(50);
    });

    test('should generate random hashes', () => {
      const hash1 = bitcoinService.generateRandomHash();
      const hash2 = bitcoinService.generateRandomHash();
      
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
      expect(hash1).not.toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]+$/);
    });

    test('should generate random strings', () => {
      const str1 = bitcoinService.generateRandomString(10);
      const str2 = bitcoinService.generateRandomString(20);
      
      expect(str1).toHaveLength(10);
      expect(str2).toHaveLength(20);
      expect(str1).not.toBe(str2);
      expect(str1).toMatch(/^[a-z0-9]+$/);
    });
  });
});

// Clean up mocks after tests
afterEach(() => {
  jest.clearAllMocks();
});