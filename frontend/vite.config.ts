import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@creit.tech/stellar-wallets-kit/sdk',
      '@creit.tech/stellar-wallets-kit/modules/utils',
      '@creit.tech/stellar-wallets-kit/modules/wallet-connect',
    ],
  },
  server: {
    port: 3000,
    open: true,
  },
})
