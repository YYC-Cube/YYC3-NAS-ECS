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
  readonly VITE_AUTH_JWT_SECRET: string
  readonly VITE_ENABLE_MOCK_DATA: boolean
  readonly VITE_ENABLE_DEBUG: boolean
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: boolean
  readonly VITE_ENABLE_ERROR_TRACKING: boolean
  readonly VITE_LOG_LEVEL: string
  readonly VITE_LOG_TO_CONSOLE: boolean
  readonly VITE_LOG_TO_SERVER: boolean
  readonly VITE_CACHE_ENABLED: boolean
  readonly VITE_CACHE_TTL: number
  readonly VITE_DEBOUNCE_DELAY: number
  readonly VITE_THEME: string
  readonly VITE_LANGUAGE: string
  readonly VITE_TIMEZONE: string
  readonly VITE_ENABLE_DEVTOOLS: boolean
  readonly VITE_ENABLE_HOT_RELOAD: boolean
  readonly VITE_SOURCE_MAP: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
