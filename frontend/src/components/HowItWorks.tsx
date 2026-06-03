const steps = [
  {
    step: '01',
    title: 'Supplier creates invoice',
    body: 'A verified supplier submits buyer address, USDC amount, discount rate, and maturity date. The Soroban contract stores the invoice on-chain with PENDING status.',
  },
  {
    step: '02',
    title: 'Investor funds escrow',
    body: 'Investors browse the marketplace and transfer USDC into contract escrow. When fully funded, status moves to FUNDED and the supplier receives early liquidity.',
  },
  {
    step: '03',
    title: 'Buyer repays automatically',
    body: 'At maturity the corporate buyer repays in USDC. The contract splits funds — principal plus yield to the investor, remainder to the supplier.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="page-section border-b theme-border py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="section-label mb-4">Process</p>
          <h2 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">
            How InvoiceFi works
          </h2>
          <p className="mt-4 text-base leading-7 theme-muted">
            Three roles, one transparent flow — from invoice creation to automated settlement on
            Stellar Testnet.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <article
              key={item.step}
              className="feature-card group relative border theme-border theme-surface p-8"
            >
              <span className="font-display text-5xl font-bold text-[color-mix(in_srgb,var(--accent)_20%,transparent)]">
                {item.step}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold theme-heading">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-subtle">{item.body}</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
