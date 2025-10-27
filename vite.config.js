import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Always use root base for Vercel
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    historyApiFallback: true,
  }
})