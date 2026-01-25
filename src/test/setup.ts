import { afterEach, vi, beforeAll } from 'vitest';
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

function setupTestEnvironment() {
  global.console = {
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
  process.env.VITE_APP_ENV = 'development';
  process.env.VITE_ENABLE_MOCK_DATA = 'true';
  process.env.VITE_ENABLE_DEBUG = 'true';
  process.env.VITE_LOG_LEVEL = 'debug';
  process.env.VITE_API_BASE_URL = 'http://localhost:6000';
  process.env.VITE_API_TIMEOUT = '30000';
  process.env.VITE_AUTH_JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.VITE_AUTH_TOKEN_STORAGE = 'localStorage';
  process.env.VITE_AUTH_REFRESH_TOKEN_ENABLED = 'true';
  process.env.VITE_ENABLE_PERFORMANCE_MONITORING = 'true';
  process.env.VITE_ENABLE_ERROR_TRACKING = 'true';
  process.env.VITE_LOG_TO_CONSOLE = 'true';
  process.env.VITE_LOG_TO_SERVER = 'false';
  process.env.VITE_CACHE_ENABLED = 'true';
  process.env.VITE_CACHE_TTL = '300000';
  process.env.VITE_DEBOUNCE_DELAY = '300';
  process.env.VITE_THEME = 'default';
  process.env.VITE_LANGUAGE = 'zh-CN';
  process.env.VITE_TIMEZONE = 'Asia/Shanghai';
  process.env.NODE_ENV = 'test';

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
