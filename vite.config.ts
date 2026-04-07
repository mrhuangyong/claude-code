import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    mainFields: ['module', 'jsnext:main', 'main']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      external: [
        'bun:bundle',
        'node:fs',
        'node:os',
        'node:crypto',
        'node:path'
      ]
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
