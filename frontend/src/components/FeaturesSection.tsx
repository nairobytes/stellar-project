import { Link } from 'react-router-dom'
import { Building2, LineChart, Store } from 'lucide-react'

const features = [
  {
    icon: Building2,
    role: 'Supplier',
    path: '/supplier',
    title: 'Get paid today',
    points: [
      'Create and track invoices with live status',
      'Partial or full financing options',
      'Portable on-chain credit history',
    ],
  },
  {
    icon: LineChart,
    role: 'Investor',
    path: '/investor',
    title: 'Earn transparent yield',
    points: [
      'Browse pending invoices with credit scores',
      'One-click USDC funding into escrow',
      '5% yield enforced by smart contract',
    ],
  },
  {
    icon: Store,
    role: 'Buyer',
    title: 'Pay on schedule',
    points: [
      'View all obligations in one portal',
      'Repay with principal + yield split',
      'Immutable audit trail for finance teams',
    ],
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="page-section py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="section-label mb-4">Platform</p>
          <h2 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">
            Built for every participant
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 theme-muted">
            Whether you supply goods, deploy capital, or settle corporate payables — InvoiceFi
            gives each role a dedicated dashboard on Stellar.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {features.map(({ icon: Icon, role, path, title, points }) => (
            <Link
              key={role}
              to={path ?? "#"}
              className="feature-card flex flex-col border theme-border bg-white p-8 text-left transition hover:border-stellar/40"
            >
              <div className="flex h-12 w-12 items-center justify-center border theme-border bg-stellar/5">
                <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">{role}</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold theme-heading">{title}</h3>
              <ul className="mt-6 flex-1 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6 text-subtle">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stellar" />
                    {point}
                  </li>
                ))}
              </ul>
              <span className="mt-6 text-xs uppercase tracking-[0.2em] text-accent">
                Open dashboard →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
