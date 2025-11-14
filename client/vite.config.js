import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/rides': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/bookings': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/tracking': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/reports': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/reviews': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/sos': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/geo-fencing': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
})
