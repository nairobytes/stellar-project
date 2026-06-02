import { useWallet } from '../hooks/useWallet'
import { useSupplierInvoices } from '../hooks/useInvoices'
import { CreateInvoiceForm } from './CreateInvoiceForm'
import { InvoiceTable } from './InvoiceTable'

export function SupplierDashboard() {
  const { account, isConnected } = useWallet()
  const { data: invoices, isLoading, error } = useSupplierInvoices(account)

  if (!isConnected) {
    return (
      <div className="card bg-blue-900/20 border-blue-500/50 text-blue-400">
        <p>Please connect your wallet to view the supplier dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Invoice Form */}
      <div className="grid md:grid-cols-2 gap-6">
        <CreateInvoiceForm />
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-white">Dashboard Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Invoices:</span>
              <span className="text-2xl font-bold text-blue-400">{invoices?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pending:</span>
              <span className="text-2xl font-bold text-yellow-400">
                {invoices?.filter((inv) => inv.status === 'Pending').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Funded:</span>
              <span className="text-2xl font-bold text-green-400">
                {invoices?.filter((inv) => inv.status === 'Funded').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Repaid:</span>
              <span className="text-2xl font-bold text-blue-400">
                {invoices?.filter((inv) => inv.status === 'Repaid').length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Your Invoices</h2>
        <InvoiceTable
          invoices={invoices || []}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}
