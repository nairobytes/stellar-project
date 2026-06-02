import { useWallet } from '../hooks/useWallet'
import { useBuyerInvoices } from '../hooks/useInvoices'
import { RepayInvoiceForm } from './RepayInvoiceForm'
import { formatUSDC, formatDate, getStatusBadgeClass, truncateAddress } from '../utils/format'

export function BuyerDashboard() {
  const { account } = useWallet()
  const { data: invoices, isLoading, error } = useBuyerInvoices(account)

  const list = invoices ?? []
  const pendingTotal =
    list
      .filter((inv) => inv.status === 'Funded' || inv.status === 'Overdue')
      .reduce((acc, inv) => acc + Number(inv.amount), 0) / 10_000_000 || 0
  const paidTotal =
    list
      .filter((inv) => inv.status === 'Repaid')
      .reduce((acc, inv) => acc + Number(inv.repaid_amount), 0) / 10_000_000 || 0

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        <RepayInvoiceForm />
        <div className="card space-y-5">
          <p className="section-label">Corporate buyer</p>
          <h3 className="font-serif text-xl font-semibold theme-heading">Payment portal</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Total invoices</span>
              <span className="stat-value">{list.length}</span>
            </div>
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Pending payment</span>
              <span className="stat-value">${pendingTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm theme-muted">Paid</span>
              <span className="stat-value">${paidTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-6">
          <p className="section-label mb-2">Buyer</p>
          <h3 className="font-serif text-2xl font-semibold theme-heading">Your obligations</h3>
        </div>

        {isLoading ? (
          <div className="card flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-stellar border-t-transparent" />
          </div>
        ) : error ? (
          <div className="alert-error">
            <p>Error loading invoices: {error.message}</p>
          </div>
        ) : list.length > 0 ? (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">ID</th>
                  <th className="table-head">Supplier</th>
                  <th className="table-head text-right">Amount owed</th>
                  <th className="table-head text-center">Status</th>
                  <th className="table-head">Due</th>
                  <th className="table-head text-right">Days left</th>
                </tr>
              </thead>
              <tbody>
                {list.map((invoice, idx) => {
                  const now = Math.floor(Date.now() / 1000)
                  const daysLeft = Math.max(
                    0,
                    Math.ceil((Number(invoice.maturity_time) - now) / 86400)
                  )

                  return (
                    <tr key={idx} className="table-row">
                      <td className="py-3 px-4 theme-heading">{invoice.id.toString()}</td>
                      <td className="py-3 px-4 font-mono text-xs text-accent">
                        {truncateAddress(invoice.supplier, 4, 4)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-accent">
                        ${formatUSDC(invoice.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={getStatusBadgeClass(invoice.status)}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 theme-muted">
                        {formatDate(invoice.maturity_time)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          daysLeft <= 7
                            ? 'text-red-700'
                            : daysLeft <= 30
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        {daysLeft} days
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center theme-muted">
            <p>No invoices found where you are the buyer</p>
          </div>
        )}
      </section>
    </div>
  )
}
