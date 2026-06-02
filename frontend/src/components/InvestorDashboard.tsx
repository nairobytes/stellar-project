import { usePendingInvoices } from '../hooks/useInvoices'
import { FundInvoiceForm } from './FundInvoiceForm'
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

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        <FundInvoiceForm />
        <div className="card space-y-5">
          <p className="section-label">Marketplace</p>
          <h3 className="font-serif text-xl font-semibold theme-heading">Investor summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Available invoices</span>
              <span className="stat-value">{invoices?.length ?? 0}</span>
            </div>
            <div className="flex justify-between items-center border-b theme-border pb-3">
              <span className="text-sm theme-muted">Yield rate</span>
              <span className="stat-value">{(INVESTOR_YIELD_BPS / 100).toFixed(2)}%</span>
            </div>
          </div>
          <ul className="text-sm leading-6 theme-muted space-y-2">
            <li>• {(INVESTOR_YIELD_BPS / 100).toFixed(2)}% yield on principal at repayment</li>
            <li>• USDC held in Soroban escrow until buyer pays</li>
            <li>• Credit scores help assess supplier risk</li>
          </ul>
        </div>
      </div>

      <section>
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
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
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
        ) : (
          <div className="card text-center theme-muted">
            <p>No pending invoices available for funding</p>
          </div>
        )}
      </section>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="card flex h-32 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stellar border-t-transparent" />
    </div>
  )
}
