import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:9000',
      '^/uploads/.*': 'http://localhost:9000',
      '^/elections/manifesto/.*': 'http://localhost:9000'
    },
    open: true
  }
})
