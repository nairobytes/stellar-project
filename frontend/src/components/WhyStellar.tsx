const rows = [
  { metric: 'Settlement time', stellar: '3–5 seconds', traditional: '1–3 business days' },
  { metric: 'Transaction cost', stellar: '~$0.00001', traditional: '$15 – $50 per wire' },
  { metric: 'Availability', stellar: '24/7/365', traditional: 'Business hours only' },
  { metric: 'Transparency', stellar: 'Full on-chain audit', traditional: 'Internal ledgers' },
  { metric: 'Programmability', stellar: 'Soroban smart contracts', traditional: 'Manual processing' },
]

export function WhyStellar() {
  return (
    <section className="border-y theme-border theme-accent-wash py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-label mb-4">Why Stellar</p>
            <h2 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">
              Enterprise finance,
              <span className="text-accent block">without enterprise friction.</span>
            </h2>
            <p className="mt-4 text-base leading-7 theme-muted">
              InvoiceFi runs on Stellar Testnet with USDC settlement, Freighter wallet signing,
              and Soroban contracts written in Rust — the same stack you will ship to mainnet
              with one configuration change.
            </p>
          </div>

          <div className="overflow-hidden border theme-border theme-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b theme-border theme-accent-wash-strong">
                  <th className="table-head">Metric</th>
                  <th className="table-head text-accent">Stellar</th>
                  <th className="table-head">Traditional bank</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.metric} className="table-row">
                    <td className="py-4 px-4 font-medium theme-heading">{row.metric}</td>
                    <td className="py-4 px-4 font-semibold text-accent">{row.stellar}</td>
                    <td className="py-4 px-4 text-subtle">{row.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
