import { useMemo, useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useBuyerInvoices } from '../hooks/useInvoices'
import { RepayInvoiceForm } from './RepayInvoiceForm'
import { formatUSDC, formatDate, daysUntilMaturity, getStatusBadgeClass, truncateAddress } from '../utils/format'
import { Clock3, History, Receipt } from 'lucide-react'

export function BuyerDashboard() {
  const { account, isConnected } = useWallet()
  const { data: invoices, isLoading, error } = useBuyerInvoices(account)
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  const { outstanding, paid } = useMemo(() => {
    const list = invoices || []
    return {
      outstanding: list.filter((invoice) => invoice.status === 'Funded' || invoice.status === 'Overdue'),
      paid: list.filter((invoice) => invoice.status === 'Repaid'),
    }
  }, [invoices])

  if (!isConnected) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-medium text-[#0B1F3A]">Connect your wallet to view payment obligations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <BuyerSummary icon={<Receipt className="h-5 w-5" />} label="Outstanding" value={outstanding.length.toString()} />
        <BuyerSummary icon={<History className="h-5 w-5" />} label="Payment History" value={paid.length.toString()} />
        <BuyerSummary icon={<Clock3 className="h-5 w-5" />} label="Due Soon" value={outstanding.filter((invoice) => daysUntilMaturity(invoice.maturity_time) <= 3).length.toString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <RepayInvoiceForm />
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(11,31,58,0.08)]">
          <div>
            <h3 className="text-xl font-semibold text-[#0B1F3A]">Outstanding Invoices</h3>
            <p className="text-sm text-slate-500">Urgency indicators show due date pressure</p>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-3xl bg-slate-100" />)
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">Error loading invoices: {error.message}</div>
            ) : outstanding.length > 0 ? (
              outstanding.map((invoice) => {
                const dueDays = daysUntilMaturity(invoice.maturity_time)
                const urgent = dueDays <= 3
                const overdue = invoice.status === 'Overdue'
                return (
                  <div key={invoice.id.toString()} className={`rounded-3xl border p-4 transition-all duration-200 ${overdue ? 'border-red-300 bg-red-50' : urgent ? 'border-[#FF6B35]/30 bg-[#FF6B35]/5' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#0B1F3A]">{truncateAddress(invoice.supplier, 6, 4)}</div>
                        <div className="text-xs text-slate-500">Amount owed ${formatUSDC(invoice.amount)}</div>
                      </div>
                      <div className="text-sm font-semibold text-[#0B1F3A]">{dueDays} days remaining</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={getStatusBadgeClass(invoice.status)}>{invoice.status}</span>
                      <button onClick={() => setSelectedInvoice(invoice.id.toString())} className="rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">PAY</button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No outstanding invoices found.</div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[#0B1F3A]">Payment History</h3>
            <div className="mt-3 space-y-3">
              {paid.length > 0 ? paid.map((invoice) => (
                <div key={invoice.id.toString()} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Paid {truncateAddress(invoice.supplier, 6, 4)} for ${formatUSDC(invoice.repaid_amount)} on {formatDate(invoice.maturity_time)}
                </div>
              )) : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No payment history yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {selectedInvoice ? <PaymentModal invoiceId={selectedInvoice} onClose={() => setSelectedInvoice(null)} /> : null}
    </div>
  )
}

function BuyerSummary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_14px_32px_rgba(11,31,58,0.08)]">
      <div className="flex items-center justify-between text-sm text-slate-500"><span>{label}</span><span className="text-[#3E7BFA]">{icon}</span></div>
      <div className="mt-3 text-2xl font-semibold text-[#0B1F3A]">{value}</div>
    </div>
  )
}

function PaymentModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h4 className="text-xl font-semibold text-[#0B1F3A]">Confirm payment</h4>
        <p className="mt-2 text-sm text-slate-500">You are about to repay invoice #{invoiceId}.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button onClick={onClose} className="rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white">Continue</button>
        </div>
      </div>
    </div>
  )
}
