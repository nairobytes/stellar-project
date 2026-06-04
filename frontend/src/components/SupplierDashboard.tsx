import { useWallet } from '../hooks/useWallet'
import { useSupplierInvoices } from '../hooks/useInvoices'
import { AnimatedNumber } from './AnimatedNumber'
import { CreateInvoiceForm } from './CreateInvoiceForm'
import { DashboardReveal } from './DashboardReveal'
import { DashboardFaq } from './DashboardFaq'
import { InvoiceTable } from './InvoiceTable'

export function SupplierDashboard() {
  const { account } = useWallet()
  const { data: invoices, isLoading, error } = useSupplierInvoices(account)

  const list = invoices ?? []
  const pending = list.filter((inv) => inv.status === 'Pending').length
  const funded = list.filter((inv) => inv.status === 'Funded').length
  const repaid = list.filter((inv) => inv.status === 'Repaid').length

  return (
    <div className="min-w-0 space-y-10">
      <div className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
        <DashboardReveal side="left">
          <CreateInvoiceForm />
        </DashboardReveal>
        <DashboardReveal side="right" delayMs={120}>
          <div className="card dashboard-card space-y-5">
            <p className="section-label">Overview</p>
            <h3 className="font-serif text-xl font-semibold theme-heading">Your pipeline</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Total invoices</span>
                <AnimatedNumber value={list.length} />
              </div>
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Pending</span>
                <AnimatedNumber value={pending} />
              </div>
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Funded</span>
                <AnimatedNumber value={funded} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm theme-muted">Repaid</span>
                <AnimatedNumber value={repaid} />
              </div>
            </div>
          </div>
        </DashboardReveal>
      </div>

      <DashboardReveal side="left" delayMs={200}>
        <section className="min-w-0">
          <div className="mb-6">
            <p className="section-label mb-2">Supplier</p>
            <h3 className="font-serif text-2xl font-semibold theme-heading">Your invoices</h3>
          </div>
          <InvoiceTable
            invoices={list}
            isLoading={isLoading}
            error={error}
            showDescription
          />
        </section>
      </DashboardReveal>

      <DashboardFaq role="supplier" />
    </div>
  )
}
