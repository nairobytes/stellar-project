// Network Configuration
export const TESTNET_CONFIG = {
  network: 'test',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  horizonUrl: 'https://horizon-testnet.stellar.org',
}

// Contract Address (Replace with your deployed contract)
export const CONTRACT_ADDRESS = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4'

// USDC Token Address on Testnet
export const USDC_ADDRESS = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4'

// Network constants
export const STROOPS_PER_UNIT = 10_000_000 // 1 USDC = 10,000,000 stroops

// Basis points for discount calculations
export const BASIS_POINTS_DIVISOR = 10_000

// Investor yield rate (in basis points)
export const INVESTOR_YIELD_BPS = 500 // 5%

// Contract function names
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
}
