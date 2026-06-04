import { useContext, createContext, ReactNode, useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { connectWallet, getUSDCBalance, isFreighterInstalled } from '../utils/stellar'
import { PREVIEW_MODE, WALLET_CONNECT_ENABLED } from '../config'
import { WalletContextType } from '../types'
import { isMobileBrowser } from '../utils/device'
import {
  disconnectWalletKit,
  formatConnectError,
  getKitAddress,
  initWalletKit,
  isKitUserCancelError,
  subscribeWalletKit,
} from '../utils/walletKit'

export const WalletContext = createContext<WalletContextType | undefined>(undefined)

const WALLET_LABELS: Record<string, string> = {
  freighter: 'Freighter',
  wallet_connect: 'WalletConnect',
  albedo: 'Albedo',
  lobstr: 'Lobstr',
  xbull: 'xBull',
  rabet: 'Rabet',
  hana: 'Hana',
  klever: 'Klever',
  onekey: 'OneKey',
  bitget: 'Bitget',
}

function labelForWalletId(id: string | null | undefined): string | null {
  if (!id) return null
  return WALLET_LABELS[id] ?? id.replace(/_/g, ' ')
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>('0.00')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freighterAvailable, setFreighterAvailable] = useState(true)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [walletLabel, setWalletLabel] = useState<string | null>(null)
  const isMobile = isMobileBrowser()

  const syncBalance = useCallback(async (publicKey: string) => {
    const bal = await getUSDCBalance(publicKey)
    setBalance(bal)
  }, [])

  useEffect(() => {
    if (PREVIEW_MODE) return

    initWalletKit()
    void isFreighterInstalled().then(setFreighterAvailable)

    void (async () => {
      const existing = await getKitAddress()
      if (existing) {
        setAccount(existing)
        await syncBalance(existing)
      }
    })()

    return subscribeWalletKit({
      onDisconnect: () => {
        setAccount(null)
        setBalance('0.00')
        setWalletId(null)
        setWalletLabel(null)
        setError(null)
      },
      onAddressChange: (address) => {
        if (address) {
          setAccount(address)
          void syncBalance(address)
        }
      },
      onWalletSelected: (id) => {
        setWalletId(id ?? null)
        setWalletLabel(labelForWalletId(id))
      },
    })
  }, [syncBalance])

  const connect = useCallback(async () => {
    if (PREVIEW_MODE) return
    setIsLoading(true)
    setError(null)
    try {
      const publicKey = await connectWallet()
      setAccount(publicKey)
      await syncBalance(publicKey)
      toast.success('Wallet connected!')
    } catch (err) {
      if (isKitUserCancelError(err)) return
      const errorMsg = formatConnectError(err)
      if (!errorMsg) return
      setError(errorMsg)
      toast.error(errorMsg, { duration: 8000 })
    } finally {
      setIsLoading(false)
    }
  }, [syncBalance])

  const disconnect = useCallback(() => {
    void disconnectWalletKit()
    setAccount(null)
    setBalance('0.00')
    setError(null)
    setWalletId(null)
    setWalletLabel(null)
    toast.success('Wallet disconnected')
  }, [])

  const switchWallet = useCallback(async () => {
    await disconnectWalletKit()
    setAccount(null)
    setBalance('0.00')
    setError(null)
    setWalletId(null)
    setWalletLabel(null)
    await connect()
  }, [connect])

  const refreshBalance = useCallback(async () => {
    if (!account) return
    try {
      await syncBalance(account)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh balance'
      setError(errorMsg)
    }
  }, [account, syncBalance])

  const value: WalletContextType = {
    account,
    isConnected: !!account,
    balance,
    isLoading,
    error,
    walletId,
    walletLabel,
    walletConnectEnabled: WALLET_CONNECT_ENABLED,
    isMobile,
    freighterAvailable,
    connect,
    disconnect,
    refreshBalance,
    switchWallet,
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
