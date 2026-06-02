import { useMemo, useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useCreditScore, usePendingInvoices } from '../hooks/useInvoices'
import { FundInvoiceForm } from './FundInvoiceForm'
import { formatUSDC, formatDate, truncateAddress, daysUntilMaturity, getCreditScoreColor } from '../utils/format'
import { BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS } from '../config'
import { BadgeDollarSign, ShieldCheck, TrendingUp } from 'lucide-react'

export function InvestorDashboard() {
  const { isConnected } = useWallet()
  const { data: invoices, isLoading, error } = usePendingInvoices()
  const [filter, setFilter] = useState<'all' | 'highYield' | 'lowRisk' | 'dueSoon'>('all')
  const [sortBy, setSortBy] = useState<'yield' | 'amount' | 'dueDate'>('yield')

  const filtered = useMemo(() => {
    const list = invoices || []
    return list.filter((invoice) => {
      const yieldPercent = Number(((Number(invoice.discount_bps) / 100) || 0).toFixed(2))
      const dueSoon = daysUntilMaturity(invoice.maturity_time) < 7
      const creditScore = 750

      if (filter === 'highYield') return yieldPercent > 8
      if (filter === 'lowRisk') return creditScore > 700
      if (filter === 'dueSoon') return dueSoon
      return true
    }).sort((a, b) => {
      if (sortBy === 'yield') return Number(b.discount_bps) - Number(a.discount_bps)
      if (sortBy === 'amount') return Number(b.amount) - Number(a.amount)
      return Number(a.maturity_time) - Number(b.maturity_time)
    })
  }, [filter, invoices, sortBy])

  const invested = filtered.reduce((sum, invoice) => sum + Number(invoice.funded_amount), 0)
  const earned = filtered.reduce((sum, invoice) => sum + Number((invoice.amount * BigInt(INVESTOR_YIELD_BPS)) / BigInt(BASIS_POINTS_DIVISOR)), 0)

  if (!isConnected) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
        <p className="text-lg font-medium text-[#0B1F3A]">Connect your wallet to browse yield opportunities.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<BadgeDollarSign className="h-5 w-5" />} label="Total Invested" value={`$${formatUSDC(BigInt(invested))}`} />
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Total Earned" value={`$${formatUSDC(BigInt(earned))}`} />
        <SummaryCard icon={<ShieldCheck className="h-5 w-5" />} label="Active Positions" value={filtered.length.toString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <FundInvoiceForm />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(11,31,58,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#0B1F3A]">Opportunity Feed</h3>
              <p className="text-sm text-slate-500">Filters and sorting for active invoice opportunities</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'highYield', 'lowRisk', 'dueSoon'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${filter === option ? 'bg-[#3E7BFA] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {option === 'all' ? 'All' : option === 'highYield' ? 'High Yield' : option === 'lowRisk' ? 'Low Risk' : 'Due Soon'}
                </button>
              ))}
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                <option value="yield">Yield</option>
                <option value="amount">Amount</option>
                <option value="dueDate">Due Date</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-60 animate-pulse rounded-3xl bg-slate-100" />)
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">Error loading invoices: {error.message}</div>
            ) : filtered.length > 0 ? (
              filtered.map((invoice) => (
                <InvoiceOpportunityCard key={invoice.id.toString()} invoice={invoice} />
              ))
            ) : (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                No invoices match the current filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_14px_32px_rgba(11,31,58,0.08)]">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <span className="text-[#3E7BFA]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[#0B1F3A]">{value}</div>
    </div>
  )
}

function InvoiceOpportunityCard({ invoice }: { invoice: import('../types').Invoice }) {
  const { data: creditScore = 500 } = useCreditScore(invoice.supplier)
  const yieldPercent = Number(((Number(invoice.discount_bps) / 100) || 0).toFixed(2))
  const yieldAmount = (invoice.amount * BigInt(INVESTOR_YIELD_BPS)) / BigInt(BASIS_POINTS_DIVISOR)
  const dueDays = daysUntilMaturity(invoice.maturity_time)

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(11,31,58,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1F3A] text-sm font-semibold text-white">
            {invoice.supplier.slice(1, 3)}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0B1F3A]">{truncateAddress(invoice.supplier, 6, 4)}</div>
            <div className="text-xs text-slate-500">Due {formatDate(invoice.maturity_time)}</div>
          </div>
        </div>
        <span className="rounded-full bg-[#00C48C]/10 px-3 py-1 text-xs font-semibold text-[#00C48C]">{yieldPercent.toFixed(2)}% yield</span>
      </div>

      <div className="mt-4 text-3xl font-semibold tracking-tight text-[#0B1F3A]">${formatUSDC(invoice.amount)}</div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#3E7BFA] to-[#00C48C]" style={{ width: `${Math.max(15, Math.min(100, creditScore / 10))}%` }} />
      </div>
      <div className={`mt-2 text-xs font-medium ${getCreditScoreColor(creditScore)}`}>Credit score {creditScore}/1000</div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Expected profit</span>
        <span className="font-semibold text-[#0B1F3A]">${formatUSDC(yieldAmount)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
        <span>Days to maturity</span>
        <span className={`font-semibold ${dueDays <= 7 ? 'text-[#FF6B35]' : 'text-[#00C48C]'}`}>{dueDays}</span>
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#3E7BFA] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#2f67e0]">
        FUND
      </button>
    </div>
  )
}
