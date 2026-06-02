import { DashboardLayout } from '../components/DashboardLayout'
import { BuyerDashboard } from '../components/BuyerDashboard'

export function BuyerPage() {
  return (
    <DashboardLayout
      role="Buyer"
      title="Payment portal"
      description="View outstanding invoices, track due dates, and repay obligations to close the financing loop."
    >
      <BuyerDashboard />
    </DashboardLayout>
  )
}
