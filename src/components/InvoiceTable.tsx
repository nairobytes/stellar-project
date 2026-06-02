import { Invoice } from '../types'
import { formatUSDC, formatDate, getStatusBadgeClass, truncateAddress, formatBasisPoints, daysUntilMaturity } from '../utils/format'

interface InvoiceTableProps {
  invoices: Invoice[]
  isLoading: boolean
  error: Error | null
  onAction?: (invoiceId: bigint, action: string) => void
  showActionButton?: boolean
  actionLabel?: string
}

export function InvoiceTable({
  invoices,
  isLoading,
  error,
  onAction,
  showActionButton = false,
  actionLabel = 'Action',
}: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="card flex justify-center items-center h-32">
        <div className="animate-spin-slow">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-900/20 border-red-500/50 text-red-400">
        <p>Error loading invoices: {error.message}</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="card text-center text-slate-400">
        <p>No invoices found</p>
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 font-semibold text-slate-300">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-300">Supplier</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-300">Buyer</th>
            <th className="text-right py-3 px-4 font-semibold text-slate-300">Amount</th>
            <th className="text-right py-3 px-4 font-semibold text-slate-300">Funded</th>
            <th className="text-center py-3 px-4 font-semibold text-slate-300">Discount</th>
            <th className="text-center py-3 px-4 font-semibold text-slate-300">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-300">Due</th>
            {showActionButton && (
              <th className="text-center py-3 px-4 font-semibold text-slate-300">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, idx) => (
            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
              <td className="py-3 px-4 text-white">{invoice.id.toString()}</td>
              <td className="py-3 px-4 text-blue-400 text-xs">
                {truncateAddress(invoice.supplier, 4, 4)}
              </td>
              <td className="py-3 px-4 text-blue-400 text-xs">
                {truncateAddress(invoice.buyer, 4, 4)}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-green-400">
                ${formatUSDC(invoice.amount)}
              </td>
              <td className="py-3 px-4 text-right text-yellow-400">
                ${formatUSDC(invoice.funded_amount)}
              </td>
              <td className="py-3 px-4 text-center text-slate-300">
                {formatBasisPoints(invoice.discount_bps)}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={getStatusBadgeClass(invoice.status)}>
                  {invoice.status}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-400">
                {formatDate(invoice.maturity_time)}
                <div className="text-xs text-slate-500 mt-1">
                  {daysUntilMaturity(invoice.maturity_time)} days
                </div>
              </td>
              {showActionButton && (
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onAction?.(invoice.id, 'action')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                  >
                    {actionLabel}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
