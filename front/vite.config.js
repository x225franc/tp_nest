import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 1001,
    host: true,
    watch: {
      usePolling: true,
    },
  },
  define: {
    'window.config.BACKEND_URL': JSON.stringify('http://localhost:1000'),
    'window.config.FRONTEND_URL': JSON.stringify('http://localhost:1001'),
  }
})
