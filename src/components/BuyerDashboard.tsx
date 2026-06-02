import { useWallet } from '../hooks/useWallet'
import { useBuyerInvoices } from '../hooks/useInvoices'
import { RepayInvoiceForm } from './RepayInvoiceForm'
import { formatUSDC, formatDate, getStatusBadgeClass, truncateAddress } from '../utils/format'

export function BuyerDashboard() {
  const { account, isConnected } = useWallet()
  const { data: invoices, isLoading, error } = useBuyerInvoices(account)

  if (!isConnected) {
    return (
      <div className="card bg-blue-900/20 border-blue-500/50 text-blue-400">
        <p>Please connect your wallet to view the buyer dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Repay Invoice Form */}
      <div className="grid md:grid-cols-2 gap-6">
        <RepayInvoiceForm />
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-white">Dashboard Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Invoices:</span>
              <span className="text-2xl font-bold text-blue-400">{invoices?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pending Payment:</span>
              <span className="text-2xl font-bold text-red-400">
                ${invoices
                  ?.filter((inv) => inv.status === 'Funded' || inv.status === 'Overdue')
                  .reduce((acc, inv) => acc + Number(inv.amount), 0) / 10_000_000 || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Paid:</span>
              <span className="text-2xl font-bold text-green-400">
                ${invoices
                  ?.filter((inv) => inv.status === 'Repaid')
                  .reduce((acc, inv) => acc + Number(inv.repaid_amount), 0) / 10_000_000 || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Your Invoices Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Your Invoices</h2>
        {isLoading ? (
          <div className="card flex justify-center items-center h-32">
            <div className="animate-spin-slow">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : error ? (
          <div className="card bg-red-900/20 border-red-500/50 text-red-400">
            <p>Error loading invoices: {error.message}</p>
          </div>
        ) : invoices && invoices.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Supplier</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Amount Owed</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Due Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, idx) => {
                  const now = Math.floor(Date.now() / 1000)
                  const daysLeft = Math.max(0, Math.ceil((Number(invoice.maturity_time) - now) / 86400))

                  return (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-white">{invoice.id.toString()}</td>
                      <td className="py-3 px-4 text-blue-400 text-xs">
                        {truncateAddress(invoice.supplier, 4, 4)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-400">
                        ${formatUSDC(invoice.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={getStatusBadgeClass(invoice.status)}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(invoice.maturity_time)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        daysLeft <= 7 ? 'text-red-400' : daysLeft <= 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {daysLeft} days
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center text-slate-400">
            <p>No invoices found where you are the buyer</p>
          </div>
        )}
      </div>
    </div>
  )
}
