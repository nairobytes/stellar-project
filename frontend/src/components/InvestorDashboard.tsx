import { usePendingInvoices } from '../hooks/useInvoices'
import { AnimatedNumber } from './AnimatedNumber'
import { FundInvoiceForm } from './FundInvoiceForm'
import { DashboardFaq } from './DashboardFaq'
import { DashboardReveal } from './DashboardReveal'
import {
  formatUSDC,
  formatBasisPoints,
  formatDate,
  truncateAddress,
  getCreditScoreColor,
} from '../utils/format'
import { BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS } from '../config'

export function InvestorDashboard() {
  const { data: invoices, isLoading, error } = usePendingInvoices()
  const count = invoices?.length ?? 0
  const yieldPercent = INVESTOR_YIELD_BPS / 100

  return (
    <div className="min-w-0 space-y-10">
      <div className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
        <DashboardReveal side="left">
          <FundInvoiceForm />
        </DashboardReveal>
        <DashboardReveal side="right" delayMs={120}>
          <div className="card dashboard-card space-y-5">
            <p className="section-label">Marketplace</p>
            <h3 className="font-serif text-xl font-semibold theme-heading">Investor summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Available invoices</span>
                <AnimatedNumber value={count} />
              </div>
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Yield rate</span>
                <AnimatedNumber value={yieldPercent} decimals={2} suffix="%" />
              </div>
            </div>
            <ul className="text-sm leading-6 theme-muted space-y-2">
              <li>• {(INVESTOR_YIELD_BPS / 100).toFixed(2)}% yield on principal at repayment</li>
              <li>• USDC held in Soroban escrow until buyer pays</li>
              <li>• Credit scores help assess supplier risk</li>
            </ul>
          </div>
        </DashboardReveal>
      </div>

      <DashboardReveal side="right" delayMs={200}>
        <section className="min-w-0">
          <div className="mb-6">
            <p className="section-label mb-2">Investor</p>
            <h3 className="font-serif text-2xl font-semibold theme-heading">
              Pending invoices
            </h3>
          </div>

          {isLoading ? (
            <LoadingCard />
          ) : error ? (
            <div className="alert-error">
              <p>Error loading invoices: {error.message}</p>
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="card dashboard-card p-0">
              <div className="table-scroll rounded-sm">
                <table className="dashboard-table text-sm">
                  <thead>
                    <tr>
                      <th className="table-head">ID</th>
                      <th className="table-head">Supplier</th>
                      <th className="table-head text-right">Amount</th>
                      <th className="table-head text-center">Discount</th>
                      <th className="table-head text-right">Yield</th>
                      <th className="table-head">Due</th>
                      <th className="table-head text-center">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, idx) => {
                      const yieldAmount =
                        (Number(invoice.amount) * INVESTOR_YIELD_BPS) / BASIS_POINTS_DIVISOR
                      const creditScore = 750

                      return (
                        <tr key={idx} className="table-row">
                          <td className="py-3 px-4 theme-heading">{invoice.id.toString()}</td>
                          <td className="py-3 px-4 font-mono text-xs text-accent">
                            {truncateAddress(invoice.supplier, 4, 4)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-accent">
                            ${formatUSDC(invoice.amount)}
                          </td>
                          <td className="py-3 px-4 text-center theme-muted">
                            {formatBasisPoints(invoice.discount_bps)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold theme-heading">
                            ${(yieldAmount / 10_000_000).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 theme-muted">
                            {formatDate(invoice.maturity_time)}
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-semibold ${getCreditScoreColor(creditScore)}`}
                          >
                            {creditScore}/1000
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card dashboard-card text-center theme-muted">
              <p>No pending invoices available for funding</p>
            </div>
          )}
        </section>
      </DashboardReveal>

      <DashboardFaq role="investor" />
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="card dashboard-card flex h-32 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stellar border-t-transparent" />
    </div>
  )
}
