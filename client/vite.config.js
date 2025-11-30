import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // ALL API routes go through /api prefix - clean separation from SPA routes
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Static uploads
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Socket.IO
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
})
