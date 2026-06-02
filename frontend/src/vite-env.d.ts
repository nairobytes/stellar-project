/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOROBAN_RPC_URL?: string
  readonly VITE_NETWORK_PASSPHRASE?: string
  readonly VITE_HORIZON_URL?: string
  readonly VITE_CONTRACT_ADDRESS?: string
  readonly VITE_USDC_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}