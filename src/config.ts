export const TESTNET_CONFIG = {
  network: 'test',
  rpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  horizonUrl: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
};

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';

export const USDC_ADDRESS =
  import.meta.env.VITE_USDC_ADDRESS ||
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';

export const STROOPS_PER_UNIT = 10_000_000;
export const BASIS_POINTS_DIVISOR = 10_000;
export const INVESTOR_YIELD_BPS = 500;

export const APP_THEME = {
  primary: '#0B1F3A',
  accent: '#3E7BFA',
  success: '#00C48C',
  warning: '#FF6B35',
  background: '#F7FAFC',
};

export const NETWORK_LABEL =
  TESTNET_CONFIG.networkPassphrase.includes('Test') ? 'Testnet' : 'Mainnet';

export const CONTRACT_FUNCTIONS = {
  CREATE_INVOICE: 'create_invoice',
  FUND_INVOICE: 'fund_invoice',
  REPAY_INVOICE: 'repay_invoice',
  GET_INVOICE: 'get_invoice',
  GET_SUPPLIER_INVOICES: 'get_supplier_invoices',
  GET_CREDIT_SCORE: 'get_credit_score',
  MARK_OVERDUE: 'mark_overdue',
  MARK_DEFAULTED: 'mark_defaulted',
  UPDATE_CREDIT_SCORE: 'update_credit_score',
};
