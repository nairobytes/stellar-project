import { useEffect, useState } from 'react'
import { Wallet, LogOut, Zap, CircleDollarSign, Network, Wifi, ChevronRight } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { formatUSDC, truncateAddress } from '../utils/format'
import { NETWORK_LABEL } from '../config'

export type TabType = 'supplier' | 'investor' | 'buyer'

const tabs: { id: TabType; label: string }[] = [
  { id: 'supplier', label: 'Supplier' },
  { id: 'investor', label: 'Investor' },
  { id: 'buyer', label: 'Buyer' },
]

export function Header({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}) {
  const { account, isConnected, balance, isLoading, connect, disconnect } = useWallet()
  const [showPulse, setShowPulse] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => setShowPulse((value) => !value), 1200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_8px_32px_rgba(11,31,58,0.06)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1F3A] text-white shadow-lg shadow-[#0B1F3A]/20">
              <Zap className="h-5 w-5 text-[#3E7BFA]" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-[#0B1F3A]">InvoiceFi</div>
              <div className="text-xs text-slate-500">Stellar invoice financing</div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 p-1 md:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0B1F3A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-[#3E7BFA]" />
                ) : null}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 md:flex">
              <Network className="h-4 w-4 text-[#3E7BFA]" />
              <span>{NETWORK_LABEL}</span>
            </div>

            {isConnected && account ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 md:flex">
                  <CircleDollarSign className="h-4 w-4 text-[#00C48C]" />
                  <span>${formatUSDC(balance)}</span>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 lg:flex">
                  <span
                    className={`h-2.5 w-2.5 rounded-full bg-[#00C48C] ${showPulse ? 'animate-pulse' : ''}`}
                  />
                  <Wallet className="h-4 w-4 text-[#0B1F3A]" />
                  <span>{truncateAddress(account, 4, 4)}</span>
                </div>
                <button
                  onClick={disconnect}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0B1F3A] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#102b52] disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-[#3E7BFA] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:translate-y-[-1px] hover:bg-[#3166dc] disabled:opacity-60"
              >
                <Wifi className="h-4 w-4" />
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
