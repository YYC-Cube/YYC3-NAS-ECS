/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAIL_API_URL: string
  readonly VITE_LLM_API_URL: string
  readonly VITE_REDIS_API_URL: string
  readonly VITE_DDNS_API_URL: string
  readonly VITE_FRP_API_URL: string
  readonly VITE_NAS_API_URL: string
  readonly VITE_WS_URL: string
  // Vite 环境变量运行时始终为 string（布尔的语义判断用 === 'true'）
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string
  readonly VITE_ENABLE_ERROR_TRACKING: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_LOG_TO_CONSOLE: string
  readonly VITE_LOG_TO_SERVER: string
  readonly VITE_CACHE_ENABLED: string
  readonly VITE_CACHE_TTL: string
  readonly VITE_DEBOUNCE_DELAY: string
  readonly VITE_THEME: string
  readonly VITE_LANGUAGE: string
  readonly VITE_TIMEZONE: string
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_ENABLE_HOT_RELOAD: string
  readonly VITE_SOURCE_MAP: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
