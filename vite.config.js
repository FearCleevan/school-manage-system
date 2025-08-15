import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // ✅ Use relative paths in production to make assets load inside Electron package
    base: mode === 'development' ? '/' : './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  }
})
