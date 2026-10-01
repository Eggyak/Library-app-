import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/koha-api': {
        target: 'https://library.niituniversity.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/koha-api/, ''),
      },
    },
  },
})
