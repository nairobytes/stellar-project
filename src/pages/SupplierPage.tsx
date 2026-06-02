import { DashboardLayout } from '../components/DashboardLayout'
import { SupplierDashboard } from '../components/SupplierDashboard'

export function SupplierPage() {
  return (
    <DashboardLayout
      role="Supplier"
      title="Invoice management"
      description="Create invoices, track funding status, and monitor repayments for your business."
    >
      <SupplierDashboard />
    </DashboardLayout>
  )
}
