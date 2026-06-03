import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, RefreshCw, LogOut } from 'lucide-react'
import { Footer } from '../components/Footer'
import { DashboardShell } from '../components/DashboardShell'
import { ConnectWalletModal } from '../components/ConnectWalletModal'
import { useWallet } from '../hooks/useWallet'
import { NETWORK_LABEL, PREVIEW_MODE } from '../config'
import { truncateAddress } from '../utils/format'
import { getXLMBalance } from '../utils/stellar'

export function SettingsPage() {
  const {
    account,
    isConnected,
    balance,
    isLoading,
    error,
    walletLabel,
    walletConnectEnabled,
    isMobile,
    disconnect,
    refreshBalance,
    switchWallet,
  } = useWallet()

  const [xlmBalance, setXlmBalance] = useState<string>('—')
  const [showConnectModal, setShowConnectModal] = useState(false)

  useEffect(() => {
    if (!account) {
      setXlmBalance('—')
      return
    }
    void getXLMBalance(account).then(setXlmBalance)
  }, [account])

  const handleRefresh = async () => {
    await refreshBalance()
    if (account) {
      const xlm = await getXLMBalance(account)
      setXlmBalance(xlm)
    }
  }

  return (
    <DashboardShell>
      <ConnectWalletModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title="Connect a wallet"
        description="Connect a Stellar wallet (Freighter, WalletConnect on mobile, Albedo, and others) on Testnet to use the dashboards."
      />

      <main className="flex-1 theme-surface">
        <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10 lg:py-16">
          <p className="section-label mb-3">Settings</p>
          <h1 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">Wallet</h1>
          <p className="mt-3 text-sm leading-7 theme-muted">
            Manage your wallet connection. Disconnect or switch wallet to use a different account —
            on mobile, use WalletConnect when available.
          </p>

          <div className="card dashboard-card mt-10 space-y-6">
            <div className="flex items-center gap-3 border-b theme-border pb-6">
              <div className="flex h-12 w-12 items-center justify-center border theme-border theme-accent-wash">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-subtle">Status</p>
                <p className="mt-1 font-semibold theme-heading">
                  {PREVIEW_MODE
                    ? 'Preview mode'
                    : isConnected
                      ? 'Connected'
                      : 'Not connected'}
                </p>
              </div>
            </div>

            {isConnected && account ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-subtle">Public key</p>
                  <p className="mt-2 break-all font-mono text-sm text-accent">{account}</p>
                  <p className="mt-1 text-xs text-subtle">{truncateAddress(account, 10, 8)}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border theme-border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-subtle">USDC balance</p>
                    <p className="stat-value mt-2">${balance}</p>
                  </div>
                  <div className="border theme-border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-subtle">XLM balance</p>
                    <p className="stat-value mt-2">{xlmBalance} XLM</p>
                  </div>
                </div>

                {walletLabel && (
                  <p className="text-sm theme-muted">
                    Wallet: <span className="text-accent">{walletLabel}</span>
                  </p>
                )}

                <p className="text-sm theme-muted">
                  Network: <span className="text-accent">{NETWORK_LABEL}</span>
                </p>

                {isMobile && !walletConnectEnabled && (
                  <p className="text-sm text-warning">
                    WalletConnect is not configured — mobile pairing may be limited. See docs/MOBILE_WALLET.md.
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={isLoading}
                    className="btn-ghost inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh balances
                  </button>
                  <button
                    type="button"
                    onClick={() => void switchWallet()}
                    disabled={isLoading}
                    className="btn-ghost inline-flex items-center justify-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    Switch wallet
                  </button>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="btn-ghost inline-flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {error && <p className="text-sm text-error">{error}</p>}
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  disabled={PREVIEW_MODE || isLoading}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                  <Wallet className="h-4 w-4" />
                  Connect wallet
                </button>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-subtle">
            <Link to="/get-started" className="text-accent hover:underline">
              Choose a dashboard →
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </DashboardShell>
  )
}
