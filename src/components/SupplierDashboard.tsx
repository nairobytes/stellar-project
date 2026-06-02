import { useMemo } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useCreditScore, useSupplierInvoices } from '../hooks/useInvoices'
import { CreateInvoiceForm } from './CreateInvoiceForm'
import { InvoiceTable } from './InvoiceTable'
import { BadgeDollarSign, Clock3, FileText, ShieldCheck } from 'lucide-react'
import { formatUSDC } from '../utils/format'

export function SupplierDashboard() {
  const { account, isConnected } = useWallet()
  const { data: invoices, isLoading, error } = useSupplierInvoices(account)
  const { data: creditScore } = useCreditScore(account)

  const stats = useMemo(() => {
    const list = invoices || []
    return {
      totalInvoices: list.length,
      totalFunded: list.reduce((sum, invoice) => sum + Number(invoice.funded_amount), 0),
      pending: list.filter((invoice) => invoice.status === 'Pending').length,
    }
  }, [invoices])

  if (!isConnected) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-medium text-[#0B1F3A]">Connect your wallet to unlock the supplier dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Total Invoices" value={stats.totalInvoices.toString()} />
        <StatCard icon={<BadgeDollarSign className="h-5 w-5" />} label="Total Funded" value={`$${formatUSDC(BigInt(stats.totalFunded))}`} />
        <StatCard icon={<Clock3 className="h-5 w-5" />} label="Pending" value={stats.pending.toString()} />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Credit Score" value={(creditScore ?? 500).toString()} score={creditScore ?? 500} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <CreateInvoiceForm />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(11,31,58,0.08)]">
          <h3 className="text-xl font-semibold text-[#0B1F3A]">Supplier Health</h3>
          <p className="mt-1 text-sm text-slate-500">Credit score and invoice status overview</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Wallet</div>
              <div className="mt-2 text-lg font-semibold text-[#0B1F3A]">{account}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Invoices</div>
              <div className="mt-2 text-lg font-semibold text-[#0B1F3A]">{stats.totalInvoices} active records</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(11,31,58,0.08)]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#0B1F3A]">Your Invoices</h3>
            <p className="text-sm text-slate-500">Alternating rows, status badges, and hover states</p>
          </div>
        </div>
        <InvoiceTable invoices={invoices || []} isLoading={isLoading} error={error as Error | null} />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  score,
}: {
  icon: React.ReactNode
  label: string
  value: string
  score?: number
}) {
  const scoreRing = score != null
    ? score > 700
      ? 'ring-[#00C48C]/20'
      : score >= 400
        ? 'ring-[#FF6B35]/20'
        : 'ring-red-500/20'
    : 'ring-slate-200'

  return (
    <div className={`rounded-3xl bg-white p-5 shadow-[0_14px_32px_rgba(11,31,58,0.08)] ring-1 ${scoreRing}`}>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <span className="text-[#3E7BFA]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[#0B1F3A]">{value}</div>
    </div>
  )
}
