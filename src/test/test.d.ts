interface Console {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  info(...args: unknown[]): void;
}

interface Storage {
  length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

declare const global: {
  console: Console;
  localStorage: Storage;
  sessionStorage: Storage;
  process: NodeJS.Process;
  import: {
    meta: {
      env: {
        NODE_ENV: string;
        VITE_APP_ENV: string;
        VITE_ENABLE_MOCK_DATA: string;
        VITE_ENABLE_DEBUG: string;
        VITE_LOG_LEVEL: string;
        VITE_API_BASE_URL: string;
        VITE_API_TIMEOUT: string;
        VITE_AUTH_JWT_SECRET: string;
        VITE_AUTH_TOKEN_STORAGE: string;
        VITE_AUTH_REFRESH_TOKEN_ENABLED: string;
        VITE_ENABLE_PERFORMANCE_MONITORING: string;
        VITE_ENABLE_ERROR_TRACKING: string;
        VITE_LOG_TO_CONSOLE: string;
        VITE_LOG_TO_SERVER: string;
        VITE_CACHE_ENABLED: string;
        VITE_CACHE_TTL: string;
        VITE_DEBOUNCE_DELAY: string;
        VITE_THEME: string;
        VITE_LANGUAGE: string;
        VITE_TIMEZONE: string;
      };
    };
  };
};
