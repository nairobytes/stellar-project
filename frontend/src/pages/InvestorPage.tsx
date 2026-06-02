import { DashboardLayout } from '../components/DashboardLayout'
import { InvestorDashboard } from '../components/InvestorDashboard'

export function InvestorPage() {
  return (
    <DashboardLayout
      role="Investor"
      title="Invoice marketplace"
      description="Browse pending invoices, review yield and credit scores, and fund opportunities in USDC."
    >
      <InvestorDashboard />
    </DashboardLayout>
  )
}
