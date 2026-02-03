import { afterEach, vi, beforeAll, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  setupTestEnvironment();
  setupLocalStorageMock();
  setupEnvironmentVariables();
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

function setupTestEnvironment() {
  (global as any).console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn()
  };
}

function setupLocalStorageMock() {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      }
    };
  })();

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: localStorageMock,
    writable: true
  });
}

function setupEnvironmentVariables() {
  const processEnv = {
    VITE_APP_ENV: 'development',
    VITE_ENABLE_MOCK_DATA: 'true',
    VITE_ENABLE_DEBUG: 'true',
    VITE_LOG_LEVEL: 'debug',
    VITE_API_BASE_URL: 'http://localhost:6000',
    VITE_API_TIMEOUT: '30000',
    VITE_AUTH_JWT_SECRET: 'test-jwt-secret-for-testing-only',
    VITE_AUTH_TOKEN_STORAGE: 'localStorage',
    VITE_AUTH_REFRESH_TOKEN_ENABLED: 'true',
    VITE_ENABLE_PERFORMANCE_MONITORING: 'true',
    VITE_ENABLE_ERROR_TRACKING: 'true',
    VITE_LOG_TO_CONSOLE: 'true',
    VITE_LOG_TO_SERVER: 'false',
    VITE_CACHE_ENABLED: 'true',
    VITE_CACHE_TTL: '300000',
    VITE_DEBOUNCE_DELAY: '300',
    VITE_THEME: 'default',
    VITE_LANGUAGE: 'zh-CN',
    VITE_TIMEZONE: 'Asia/Shanghai',
    NODE_ENV: 'test'
  };

  (global as any).process = {
    env: processEnv
  } as any;

  (global as any).import = {
    meta: {
      env: {
        NODE_ENV: 'test',
        VITE_APP_ENV: 'development',
        VITE_ENABLE_MOCK_DATA: 'true',
        VITE_ENABLE_DEBUG: 'true',
        VITE_LOG_LEVEL: 'debug',
        VITE_API_BASE_URL: 'http://localhost:6000',
        VITE_API_TIMEOUT: '30000',
        VITE_AUTH_JWT_SECRET: 'test-jwt-secret-for-testing-only',
        VITE_AUTH_TOKEN_STORAGE: 'localStorage',
        VITE_AUTH_REFRESH_TOKEN_ENABLED: 'true',
        VITE_ENABLE_PERFORMANCE_MONITORING: 'true',
        VITE_ENABLE_ERROR_TRACKING: 'true',
        VITE_LOG_TO_CONSOLE: 'true',
        VITE_LOG_TO_SERVER: 'false',
        VITE_CACHE_ENABLED: 'true',
        VITE_CACHE_TTL: '300000',
        VITE_DEBOUNCE_DELAY: '300',
        VITE_THEME: 'default',
        VITE_LANGUAGE: 'zh-CN',
        VITE_TIMEZONE: 'Asia/Shanghai'
      }
    }
  };
}
