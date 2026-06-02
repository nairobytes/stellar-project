import { Invoice } from '../types'
import { formatUSDC, formatDate, getStatusBadgeClass, truncateAddress, formatBasisPoints, daysUntilMaturity } from '../utils/format'
import { Inbox } from 'lucide-react'

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        <p>Error loading invoices: {error.message}</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
        <Inbox className="h-10 w-10 text-[#3E7BFA]" />
        <p className="mt-3 text-base font-medium text-[#0B1F3A]">No invoices found</p>
        <p className="mt-1 text-sm text-slate-500">Create the first invoice to get the financing flow started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <th className="px-4 py-3 text-left font-semibold">ID</th>
            <th className="px-4 py-3 text-left font-semibold">Supplier</th>
            <th className="px-4 py-3 text-left font-semibold">Buyer</th>
            <th className="px-4 py-3 text-right font-semibold">Amount</th>
            <th className="px-4 py-3 text-right font-semibold">Funded</th>
            <th className="px-4 py-3 text-center font-semibold">Discount</th>
            <th className="px-4 py-3 text-center font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Due</th>
            {showActionButton && (
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, idx) => (
            <tr key={idx} className={`border-b border-slate-100 transition hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-4 text-[#0B1F3A]">{invoice.id.toString()}</td>
              <td className="px-4 py-4 text-xs text-[#3E7BFA]">
                {truncateAddress(invoice.supplier, 4, 4)}
              </td>
              <td className="px-4 py-4 text-xs text-[#3E7BFA]">
                {truncateAddress(invoice.buyer, 4, 4)}
              </td>
              <td className="px-4 py-4 text-right font-semibold text-[#0B1F3A]">
                ${formatUSDC(invoice.amount)}
              </td>
              <td className="px-4 py-4 text-right text-[#00C48C]">
                ${formatUSDC(invoice.funded_amount)}
              </td>
              <td className="px-4 py-4 text-center text-slate-600">
                {formatBasisPoints(invoice.discount_bps)}
              </td>
              <td className="px-4 py-4 text-center">
                <span className={getStatusBadgeClass(invoice.status)}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-4 py-4 text-slate-600">
                {formatDate(invoice.maturity_time)}
                <div className="mt-1 text-xs text-slate-500">
                  {daysUntilMaturity(invoice.maturity_time)} days
                </div>
              </td>
              {showActionButton && (
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => onAction?.(invoice.id, 'action')}
                    className="rounded-full bg-[#3E7BFA] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#2f67e0]"
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
