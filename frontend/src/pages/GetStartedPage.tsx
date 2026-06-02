import { Link } from 'react-router-dom'
import { Building2, LineChart, Store, ArrowRight } from 'lucide-react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

const roles = [
  {
    id: 'supplier',
    path: '/supplier',
    icon: Building2,
    title: 'Supplier',
    subtitle: 'I sell goods or services',
    description:
      'Create invoices, get funded early, and track repayments. Build your on-chain credit history.',
    cta: 'Go to supplier dashboard',
  },
  {
    id: 'investor',
    path: '/investor',
    icon: LineChart,
    title: 'Investor',
    subtitle: 'I want to earn yield',
    description:
      'Browse pending invoices, review credit scores, and fund opportunities in USDC escrow.',
    cta: 'Go to investor dashboard',
  },
  {
    id: 'buyer',
    path: '/buyer',
    icon: Store,
    title: 'Buyer',
    subtitle: 'I owe payments to suppliers',
    description:
      'View outstanding invoices, see due dates, and repay obligations when they mature.',
    cta: 'Go to buyer dashboard',
  },
]

export function GetStartedPage() {
  return (
    <div className="min-h-screen theme-bg">
      <Header />

      <main className="border-t theme-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-label mb-4">Get started</p>
            <h1 className="font-serif text-3xl font-semibold theme-heading md:text-5xl">
              Are you a buyer, supplier, or investor?
            </h1>
            <p className="mt-5 text-base leading-7 theme-muted">
              Choose your role to open the right dashboard. You can preview the app without
              connecting a wallet.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <Link
                  key={role.id}
                  to={role.path}
                  className="feature-card group flex flex-col border theme-border bg-white p-8 text-left transition hover:border-stellar/50 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center border theme-border bg-stellar/5 transition group-hover:bg-stellar/10">
                    <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                  </div>
                  <p className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">
                    {role.title}
                  </p>
                  <p className="mt-1 text-sm font-medium theme-heading">{role.subtitle}</p>
                  <p className="mt-4 flex-1 text-sm leading-7 text-subtle">{role.description}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
                    {role.cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>

          <p className="mt-12 text-center text-sm text-subtle">
            Not sure?{' '}
            <Link to="/#how-it-works" className="text-accent underline-offset-4 hover:underline">
              See how InvoiceFi works
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
