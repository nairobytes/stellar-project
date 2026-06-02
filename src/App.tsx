import { Header } from './components/Header'
import { DashboardTabs } from './components/DashboardTabs'
import { WalletProvider } from './hooks/useWallet'

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardTabs />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>InvoiceFi - On-Chain Invoice Financing on Stellar Testnet</p>
          <p className="text-sm mt-2">Connect your Freighter wallet to get started</p>
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
