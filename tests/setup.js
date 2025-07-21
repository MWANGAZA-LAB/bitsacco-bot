// Global test setup for Bitsacco Bot
import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise in tests
process.env.DEFAULT_LANGUAGE = 'en';
process.env.SUPPORTED_LANGUAGES = 'en,sw,fr';

// Mock console methods to reduce test output noise
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output in tests unless needed
  if (process.env.VERBOSE_TESTS !== 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
global.testUtils = {
  // Create mock user for testing
  createMockUser: (overrides = {}) => ({
    id: 'test_user_123',
    username: 'testuser',
    language: 'en',
    ...overrides
  }),

  // Create mock Lightning invoice
  createMockInvoice: (overrides = {}) => ({
    payment_request: 'lnbc1000u1p0example',
    r_hash: 'abcd1234567890',
    value: 1000,
    description: 'Test Payment',
    settled: false,
    creation_date: Math.floor(Date.now() / 1000),
    ...overrides
  }),

  // Create mock Bitcoin balance
  createMockBalance: (overrides = {}) => ({
    total_balance: 1000000,
    confirmed_balance: 1000000,
    unconfirmed_balance: 0,
    ...overrides
  }),

  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock fetch responses
  mockFetch: (data, status = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    });
  }
};

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock external dependencies that are hard to test
jest.mock('whatsapp-web.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    on: jest.fn(),
    sendMessage: jest.fn(),
    destroy: jest.fn()
  })),
  LocalAuth: jest.fn(),
  MessageMedia: jest.fn()
}));

jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    onText: jest.fn(),
    on: jest.fn(),
    sendMessage: jest.fn(),
    sendPhoto: jest.fn(),
    answerCallbackQuery: jest.fn(),
    stopPolling: jest.fn()
  }));
});

jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn(),
    once: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
    user: { id: 'test_bot_id', tag: 'TestBot#1234' }
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4,
    DirectMessages: 8
  },
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn()
  })),
  Routes: {
    applicationCommands: jest.fn()
  },
  EmbedBuilder: jest.fn(),
  ActionRowBuilder: jest.fn(),
  ButtonBuilder: jest.fn(),
  ButtonStyle: {
    Primary: 1,
    Secondary: 2,
    Success: 3,
    Danger: 4
  }
}));

// Mock Socket.IO for web chat tests
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn()
  }))
}));

// Mock QR code generation
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  toString: jest.fn().mockImplementation((data, options, callback) => {
    callback(null, 'Mock QR Code ASCII');
  })
}));

// Mock crypto for testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});