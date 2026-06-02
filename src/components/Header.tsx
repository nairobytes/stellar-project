import { useWallet } from '../hooks/useWallet'
import { truncateAddress, formatUSDC } from '../utils/format'
import { Wallet, LogOut } from 'lucide-react'

export function Header() {
  const { account, isConnected, balance, isLoading, connect, disconnect } = useWallet()

  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-400">📄</div>
            <h1 className="text-2xl font-bold text-white">InvoiceFi</h1>
          </div>

          {/* Wallet Info */}
          <div className="flex items-center gap-4">
            {isConnected && account ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                  <span className="text-sm text-slate-400">USDC Balance:</span>
                  <span className="font-semibold text-white">${balance}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">{truncateAddress(account)}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="btn-secondary flex items-center gap-2"
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                className="btn-primary flex items-center gap-2"
                disabled={isLoading}
              >
                <Wallet className="w-4 h-4" />
                <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
