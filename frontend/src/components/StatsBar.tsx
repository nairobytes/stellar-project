const stats = [
  {
    value: '7.4M+',
    label: 'Kenyan SMEs',
    description:
      'Estimated number of small and medium enterprises in Kenya — the market InvoiceFi is built to serve.',
  },
  {
    value: '60–90',
    label: 'Days average payment wait',
    description:
      'Typical delay before a supplier is paid on a corporate invoice in traditional B2B trade (not on InvoiceFi).',
  },
  {
    value: '5%',
    label: 'Investor yield on principal',
    description:
      'Target return paid to investors when a buyer repays a funded invoice in full (set in the smart contract).',
  },
  {
    value: '100%',
    label: 'On-chain audit trail',
    description:
      'Every create, fund, and repay action is recorded on Stellar — visible to anyone with the transaction hash.',
  },
]

export function StatsBar() {
  return (
    <section
      id="market-stats"
      className="border-b theme-border theme-surface"
      aria-labelledby="market-stats-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="landing-hover-block mb-10 max-w-2xl md:mb-12">
          <p className="landing-shift section-label mb-3">Market context</p>
          <h2
            id="market-stats-heading"
            className="landing-shift font-serif text-2xl font-semibold theme-heading md:text-3xl"
          >
            What these numbers mean
          </h2>
          <p className="landing-shift mt-3 text-sm leading-7 theme-muted">
            Headline figures behind the problem InvoiceFi solves — not your wallet balance or live
            dashboard totals. Use the dashboards to interact with real testnet invoices.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label} className="stat-card group text-center md:text-left">
              <p className="stat-card-value font-display text-3xl font-bold text-accent md:text-4xl">
                {stat.value}
              </p>
              <p className="stat-card-label mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {stat.label}
              </p>
              <p className="stat-card-desc mt-3 text-sm leading-6 text-subtle">{stat.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
