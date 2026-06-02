import { useContext, createContext, ReactNode, useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { connectWallet, getUSDCBalance, isFreighterInstalled } from '../utils/stellar'
import { PREVIEW_MODE } from '../config'
import { WalletContextType } from '../types'

export const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>('0.00')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freighterAvailable, setFreighterAvailable] = useState(true)

  useEffect(() => {
    if (!PREVIEW_MODE) {
      void isFreighterInstalled().then(setFreighterAvailable)
    }
  }, [])

  const connect = useCallback(async () => {
    if (PREVIEW_MODE) return
    setIsLoading(true)
    setError(null)
    try {
      if (!freighterAvailable) {
        throw new Error('Freighter is not installed')
      }
      const publicKey = await connectWallet()
      setAccount(publicKey)
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
  }, [freighterAvailable])

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

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
