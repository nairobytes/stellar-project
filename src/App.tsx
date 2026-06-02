import { useState } from 'react'
import { Header, type TabType } from './components/Header'
import { DashboardTabs } from './components/DashboardTabs'
import { WalletProvider } from './hooks/useWallet'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('supplier')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(62,123,250,0.12),_transparent_28%),linear-gradient(180deg,_#F7FAFC_0%,_#EAF0F8_100%)] text-slate-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <DashboardTabs activeTab={activeTab} />
      </main>

      <footer className="border-t border-slate-200/80 bg-white/60 py-6 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          InvoiceFi on Stellar Soroban
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  )
}
