// Global test setup for Bitsacco WhatsApp Bot
// TypeScript version with enhanced type safety
import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise in tests

// Define types for test utilities
interface TestUtils {
  wait: (ms?: number) => Promise<void>;
  mockFetch: (data: any, status?: number) => void;
}

interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

interface MockWhatsAppClient {
  initialize: jest.MockedFunction<() => void>;
  on: jest.MockedFunction<(event: string, handler: Function) => void>;
  sendMessage: jest.MockedFunction<(chatId: string, message: string) => Promise<any>>;
  destroy: jest.MockedFunction<() => Promise<void>>;
}

interface MockWhatsAppModule {
  Client: jest.MockedClass<any>;
  LocalAuth: jest.MockedClass<any>;
  MessageMedia: jest.MockedClass<any>;
}

// Store original console methods with proper typing
const originalConsole: {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
} = { ...console };

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

// Global test utilities with proper typing
const testUtils: TestUtils = {
  // Wait for async operations
  wait: (ms = 100): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock fetch responses
  mockFetch: (data: any, status = 200): void => {
    const mockResponse: MockFetchResponse = {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);
  }
};

// Extend global with test utilities
declare global {
  var testUtils: TestUtils;
}

global.testUtils = testUtils;

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock external dependencies that are hard to test (WhatsApp only)
const mockWhatsAppModule: MockWhatsAppModule = {
  Client: jest.fn().mockImplementation((): MockWhatsAppClient => ({
    initialize: jest.fn(),
    on: jest.fn(),
    sendMessage: jest.fn(),
    destroy: jest.fn()
  })),
  LocalAuth: jest.fn(),
  MessageMedia: jest.fn()
};

jest.mock('whatsapp-web.js', () => mockWhatsAppModule);

// Mock crypto for testing with proper typing
interface MockCrypto {
  randomUUID: () => string;
}

const mockCrypto: MockCrypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto
});

// Mock winston logger for testing
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Mock dotenv for testing
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock fastify for testing
jest.mock('fastify', () => {
  const mockFastify = {
    register: jest.fn(),
    listen: jest.fn(),
    close: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    addHook: jest.fn(),
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }
  };

  return jest.fn(() => mockFastify);
});

// Mock common Node.js modules
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn()
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => '/' + args.join('/'))
}));

// Additional TypeScript-specific test helpers
export interface TestContext {
  mockClient: MockWhatsAppClient;
  mockLogger: any;
  cleanup: () => void;
}

export const createTestContext = (): TestContext => {
  const mockClient: MockWhatsAppClient = {
    initialize: jest.fn(),
    on: jest.fn(),
    sendMessage: jest.fn(),
    destroy: jest.fn()
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  };

  const cleanup = () => {
    jest.clearAllMocks();
  };

  return {
    mockClient,
    mockLogger,
    cleanup
  };
};

// Type-safe environment variable mocking
export const mockEnvVar = (key: string, value: string): void => {
  const originalValue = process.env[key];
  process.env[key] = value;

  // Return cleanup function
  afterEach(() => {
    if (originalValue !== undefined) {
      process.env[key] = originalValue;
    } else {
      delete process.env[key];
    }
  });
};

// Async test wrapper with timeout
export const withTimeout = <T>(
  fn: () => Promise<T>,
  timeoutMs = 5000
): Promise<T> => {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Test timed out')), timeoutMs)
    )
  ]);
};

export default testUtils;
