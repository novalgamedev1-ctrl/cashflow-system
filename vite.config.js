import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['supabase'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})