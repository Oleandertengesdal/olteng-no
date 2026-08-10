import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Hver widget lastes dynamisk. Standardgrensen på 500 kB gir advarsler for
    // en samlet bunt vi uansett ikke vil ha — vi vil ha mange små.
    chunkSizeWarningLimit: 300,
  },
})
