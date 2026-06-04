import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useBuyerInvoices } from '../hooks/useInvoices'
import { AnimatedNumber } from './AnimatedNumber'
import { RepayInvoiceForm } from './RepayInvoiceForm'
import { DashboardFaq } from './DashboardFaq'
import { DashboardReveal } from './DashboardReveal'
import { formatUSDC, formatDate, getStatusBadgeClass, truncateAddress } from '../utils/format'

export function BuyerDashboard() {
  const [repayInvoiceId, setRepayInvoiceId] = useState('')
  const { account } = useWallet()
  const { data: invoices, isLoading, error } = useBuyerInvoices(account)

  const list = invoices ?? []
  const pendingTotal =
    list
      .filter((inv) => inv.status === 'Funded' || inv.status === 'Overdue')
      .reduce((acc, inv) => acc + Number(inv.amount), 0) / 10_000_000 || 0
  const paidTotal =
    list
      .filter((inv) => inv.status === 'Repaid')
      .reduce((acc, inv) => acc + Number(inv.repaid_amount), 0) / 10_000_000 || 0

  return (
    <div className="min-w-0 space-y-10">
      <div className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
        <DashboardReveal side="left">
          <RepayInvoiceForm
            selectedInvoiceId={repayInvoiceId}
            onSelectedInvoiceIdChange={setRepayInvoiceId}
          />
        </DashboardReveal>
        <DashboardReveal side="right" delayMs={120}>
          <div className="card dashboard-card space-y-5">
            <p className="section-label">Corporate buyer</p>
            <h3 className="font-serif text-xl font-semibold theme-heading">Payment portal</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Total invoices</span>
                <AnimatedNumber value={list.length} />
              </div>
              <div className="flex justify-between items-center border-b theme-border pb-3">
                <span className="text-sm theme-muted">Pending payment</span>
                <AnimatedNumber value={pendingTotal} prefix="$" decimals={2} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm theme-muted">Paid</span>
                <AnimatedNumber value={paidTotal} prefix="$" decimals={2} />
              </div>
            </div>
          </div>
        </DashboardReveal>
      </div>

      <DashboardReveal side="left" delayMs={200}>
        <section className="min-w-0">
          <div className="mb-6">
            <p className="section-label mb-2">Buyer</p>
            <h3 className="font-serif text-2xl font-semibold theme-heading">Your obligations</h3>
          </div>

          {isLoading ? (
            <div className="card dashboard-card flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-stellar border-t-transparent" />
            </div>
          ) : error ? (
            <div className="alert-error">
              <p>Error loading invoices: {error.message}</p>
            </div>
          ) : list.length > 0 ? (
            <div className="card dashboard-card p-0">
              <div className="table-scroll rounded-sm">
                <table className="dashboard-table text-sm">
                  <thead>
                    <tr>
                      <th className="table-head">ID</th>
                      <th className="table-head">Supplier</th>
                      <th className="table-head text-right">Amount owed</th>
                      <th className="table-head text-center">Status</th>
                      <th className="table-head">Due</th>
                      <th className="table-head text-right">Days left</th>
                      <th className="table-head text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((invoice, idx) => {
                      const canRepay =
                        invoice.status === 'Funded' || invoice.status === 'Overdue'
                      const now = Math.floor(Date.now() / 1000)
                      const daysLeft = Math.max(
                        0,
                        Math.ceil((Number(invoice.maturity_time) - now) / 86400),
                      )

                      return (
                        <tr key={idx} className="table-row">
                          <td className="py-3 px-4 theme-heading">{invoice.id.toString()}</td>
                          <td className="py-3 px-4 font-mono text-xs text-accent">
                            {truncateAddress(invoice.supplier, 4, 4)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-accent">
                            ${formatUSDC(invoice.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={getStatusBadgeClass(invoice.status)}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 theme-muted">
                            {formatDate(invoice.maturity_time)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-semibold ${
                              daysLeft <= 7
                                ? 'text-danger'
                                : daysLeft <= 30
                                  ? 'text-warning'
                                  : 'text-success'
                            }`}
                          >
                            {daysLeft} days
                          </td>
                          <td className="py-3 px-4 text-right">
                            {canRepay ? (
                              <button
                                type="button"
                                className="text-xs font-semibold uppercase tracking-wide text-accent hover:underline"
                                onClick={() => {
                                  setRepayInvoiceId(invoice.id.toString())
                                  document.getElementById('repay-invoice-id')?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  })
                                }}
                              >
                                Repay
                              </button>
                            ) : (
                              <span className="text-xs theme-muted">
                                {invoice.status === 'Pending' ? 'Awaiting fund' : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card dashboard-card text-center theme-muted space-y-2">
              <p>No invoices found where you are the buyer</p>
              {account && (
                <p className="font-mono text-xs break-all">
                  Connected: {account}
                </p>
              )}
              <p className="text-xs leading-5">
                The supplier must enter this exact address when creating the invoice. Pending invoices
                appear here too — funding is not required to see them.
              </p>
            </div>
          )}
        </section>
      </DashboardReveal>

      <DashboardFaq role="buyer" />
    </div>
  )
}
