import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: env.VITE_API_PROXY_ENABLED === 'true' ? {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:6000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      } : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: env.VITE_SOURCE_MAP === 'true',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
    },
  };
});
