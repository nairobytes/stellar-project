// Invoice Status
export type InvoiceStatus = 'Pending' | 'Funded' | 'Repaid' | 'Overdue' | 'Defaulted'

// Invoice data structure
export interface Invoice {
  id: bigint
  supplier: string
  buyer: string
  amount: bigint
  discount_bps: number
  funded_amount: bigint
  status: InvoiceStatus
  maturity_time: bigint
  investor: string | null
  creation_time: bigint
  repaid_amount: bigint
  /** Goods / service label — stored in browser per invoice (not on-chain yet) */
  description?: string
}

// Create invoice form data
export interface CreateInvoiceFormData {
  buyerAddress: string
  /** What goods or services this invoice covers */
  description: string
  amount: string
  discountRate: string
  dueDate: string
}

// Fund invoice form data
export interface FundInvoiceFormData {
  invoiceId: string
  amount: string
}

// Repay invoice form data
export interface RepayInvoiceFormData {
  invoiceId: string
  amount: string
}

// Wallet context
export interface WalletContextType {
  account: string | null
  isConnected: boolean
  balance: string
  isLoading: boolean
  error: string | null
  /** Active kit wallet id, e.g. freighter, wallet_connect */
  walletId: string | null
  walletLabel: string | null
  walletConnectEnabled: boolean
  isMobile: boolean
  /** @deprecated Prefer walletConnectEnabled + kit connect */
  freighterAvailable: boolean
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  switchWallet: () => Promise<void>
}
