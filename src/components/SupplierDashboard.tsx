import { useWallet } from '../hooks/useWallet'
import { useSupplierInvoices } from '../hooks/useInvoices'
import { CreateInvoiceForm } from './CreateInvoiceForm'
import { InvoiceTable } from './InvoiceTable'

export function SupplierDashboard() {
  const { account } = useWallet()
  const { data: invoices, isLoading, error } = useSupplierInvoices(account)

  const list = invoices ?? []

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        <CreateInvoiceForm />
        <div className="card space-y-5">
          <p className="section-label">Overview</p>
          <h3 className="font-serif text-xl font-semibold theme-heading">Your pipeline</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Total invoices</span>
              <span className="stat-value">{list.length}</span>
            </div>
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Pending</span>
              <span className="stat-value">
                {list.filter((inv) => inv.status === 'Pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Funded</span>
              <span className="stat-value">
                {list.filter((inv) => inv.status === 'Funded').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm theme-muted">Repaid</span>
              <span className="stat-value">
                {list.filter((inv) => inv.status === 'Repaid').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-6">
          <p className="section-label mb-2">Supplier</p>
          <h3 className="font-serif text-2xl font-semibold theme-heading">Your invoices</h3>
        </div>
        <InvoiceTable invoices={list} isLoading={isLoading} error={error} />
      </section>
    </div>
  )
}
