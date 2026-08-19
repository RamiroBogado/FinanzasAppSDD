import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendTarget = process.env.VITE_PROXY_BACKEND || 'http://localhost:3001'
const aiTarget = process.env.VITE_PROXY_AI || 'http://localhost:3002'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/ai': {
        target: aiTarget,
        changeOrigin: true
      }
    }
  }
})