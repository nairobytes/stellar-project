import { useContext, createContext, ReactNode, useState, useCallback } from 'react'
import * as Freighter from '@stellar/freighter-api'
import toast from 'react-hot-toast'
import { connectWallet, getUSDCBalance } from '../utils/stellar'
import { WalletContextType } from '../types'

// Create wallet context
export const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Wallet provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>('0.00')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const publicKey = await connectWallet()
      setAccount(publicKey)
      
      // Fetch balance
      const bal = await getUSDCBalance(publicKey)
      setBalance(bal)
      
      toast.success('Wallet connected!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setBalance('0.00')
    setError(null)
    toast.success('Wallet disconnected')
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!account) return
    try {
      const bal = await getUSDCBalance(account)
      setBalance(bal)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh balance'
      setError(errorMsg)
    }
  }, [account])

  const value: WalletContextType = {
    account,
    isConnected: !!account,
    balance,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// Hook to use wallet context
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
