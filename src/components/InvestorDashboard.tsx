import { useWallet } from '../hooks/useWallet'
import { usePendingInvoices, useCreditScore } from '../hooks/useInvoices'
import { FundInvoiceForm } from './FundInvoiceForm'
import { formatUSDC, formatBasisPoints, formatDate, truncateAddress, calculateInvestorYield, getCreditScoreColor } from '../utils/format'
import { BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS } from '../config'

export function InvestorDashboard() {
  const { isConnected } = useWallet()
  const { data: invoices, isLoading, error } = usePendingInvoices()

  if (!isConnected) {
    return (
      <div className="card bg-blue-900/20 border-blue-500/50 text-blue-400">
        <p>Please connect your wallet to view the investor dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fund Invoice Form */}
      <div className="grid md:grid-cols-2 gap-6">
        <FundInvoiceForm />
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-white">Dashboard Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Available Invoices:</span>
              <span className="text-2xl font-bold text-blue-400">{invoices?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Investor Yield Rate:</span>
              <span className="text-2xl font-bold text-green-400">
                {(INVESTOR_YIELD_BPS / 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-slate-400 mt-4">
              <p>• Each funded invoice provides {(INVESTOR_YIELD_BPS / 100).toFixed(2)}% yield on principal</p>
              <p>• Funds are held in escrow until buyer repays</p>
              <p>• High credit score suppliers have lower default risk</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invoices Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Available Invoices for Funding</h2>
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
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-300">Discount</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Yield</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Due Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-300">Credit Score</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, idx) => {
                  const yieldAmount = (Number(invoice.amount) * INVESTOR_YIELD_BPS) / BASIS_POINTS_DIVISOR
                  const creditScore = 750 // TODO: Fetch real credit score

                  return (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-white">{invoice.id.toString()}</td>
                      <td className="py-3 px-4 text-blue-400 text-xs">
                        {truncateAddress(invoice.supplier, 4, 4)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-400">
                        ${formatUSDC(invoice.amount)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {formatBasisPoints(invoice.discount_bps)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-yellow-400">
                        ${(yieldAmount / 10_000_000).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(invoice.maturity_time)}
                      </td>
                      <td className={`py-3 px-4 text-center font-semibold ${getCreditScoreColor(creditScore)}`}>
                        {creditScore}/1000
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center text-slate-400">
            <p>No pending invoices available for funding</p>
          </div>
        )}
      </div>
    </div>
  )
}
