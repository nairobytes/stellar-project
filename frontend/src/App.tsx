import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { SupplierPage } from './pages/SupplierPage'
import { InvestorPage } from './pages/InvestorPage'
import { BuyerPage } from './pages/BuyerPage'
import { GetStartedPage } from './pages/GetStartedPage'
import { SettingsPage } from './pages/SettingsPage'
import { WalletProvider } from './hooks/useWallet'
import { ThemeProvider } from './hooks/useTheme'

export default function App() {
  return (
    <ThemeProvider>
    <WalletProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/supplier" element={<SupplierPage />} />
          <Route path="/investor" element={<InvestorPage />} />
          <Route path="/buyer" element={<BuyerPage />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
    </ThemeProvider>
  )
}
