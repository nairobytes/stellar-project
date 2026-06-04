import { Invoice } from '../types'
import {
  formatUSDC,
  formatDate,
  getStatusBadgeClass,
  truncateAddress,
  formatBasisPoints,
  daysUntilMaturity,
} from '../utils/format'

interface InvoiceTableProps {
  invoices: Invoice[]
  isLoading: boolean
  error: Error | null
  onAction?: (invoiceId: bigint, action: string) => void
  showActionButton?: boolean
  actionLabel?: string
  /** Show goods / service description column (supplier labels from browser storage) */
  showDescription?: boolean
  emptyMessage?: string
}

export function InvoiceTable({
  invoices,
  isLoading,
  error,
  onAction,
  showActionButton = false,
  actionLabel = 'Action',
  showDescription = false,
  emptyMessage = 'No invoices found',
}: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="card dashboard-card flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stellar border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert-error">
        <p>Error loading invoices: {error.message}</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="card dashboard-card text-center theme-muted">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="card dashboard-card p-0">
      <div className="table-scroll rounded-sm">
        <table className="dashboard-table text-sm">
        <thead>
          <tr>
            <th className="table-head">ID</th>
            {showDescription && <th className="table-head">Invoice for</th>}
            <th className="table-head">Supplier</th>
            <th className="table-head">Buyer</th>
            <th className="table-head text-right">Amount</th>
            <th className="table-head text-right">Funded</th>
            <th className="table-head text-center">Discount</th>
            <th className="table-head text-center">Status</th>
            <th className="table-head">Due</th>
            {showActionButton && <th className="table-head text-center">Action</th>}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, idx) => (
            <tr key={idx} className="table-row">
              <td className="py-3 px-4 theme-heading">{invoice.id.toString()}</td>
              {showDescription && (
                <td className="py-3 px-4 max-w-[14rem] text-sm theme-muted">
                  {invoice.description ? (
                    <span className="line-clamp-2" title={invoice.description}>
                      {invoice.description}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
              )}
              <td className="py-3 px-4 font-mono text-xs text-accent">
                {truncateAddress(invoice.supplier, 4, 4)}
              </td>
              <td className="py-3 px-4 font-mono text-xs text-accent">
                {truncateAddress(invoice.buyer, 4, 4)}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-accent">
                ${formatUSDC(invoice.amount)}
              </td>
              <td className="py-3 px-4 text-right theme-muted">
                ${formatUSDC(invoice.funded_amount)}
              </td>
              <td className="py-3 px-4 text-center theme-muted">
                {formatBasisPoints(invoice.discount_bps)}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={getStatusBadgeClass(invoice.status)}>{invoice.status}</span>
              </td>
              <td className="py-3 px-4 theme-muted">
                {formatDate(invoice.maturity_time)}
                <div className="mt-1 text-xs text-subtle">
                  {daysUntilMaturity(invoice.maturity_time)} days
                </div>
              </td>
              {showActionButton && (
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onAction?.(invoice.id, 'action')}
                    className="btn-primary !px-4 !py-2 text-xs"
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
    </div>
  )
}
