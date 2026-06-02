import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap } from 'lucide-react'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b theme-border">
      <div className="hero-mesh absolute inset-0" aria-hidden />
      <div className="hero-gradient absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl animate-fade-up">
            <h1 className="heading-serif">
              Turn invoices into
              <span className="text-accent block">instant liquidity.</span>
            </h1>

            <p className="mt-6 text-base leading-8 theme-muted md:text-lg">
              InvoiceFi connects Kenyan suppliers, yield-seeking investors, and corporate
              buyers on Stellar. Smart contracts hold USDC in escrow and distribute funds
              automatically — no banks, no paper, no delays.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link to="/get-started" className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => scrollTo('how-it-works')}
                className="btn-ghost w-full sm:w-auto"
              >
                How it works
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 border-t theme-border pt-8 sm:grid-cols-3">
              <div>
                <p className="font-display text-2xl font-bold text-accent md:text-3xl">3–5s</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-subtle">Settlement</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-accent md:text-3xl">~$0.00001</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-subtle">Per transaction</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-accent md:text-3xl">24/7</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-subtle">On-chain escrow</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="hero-card-stack space-y-4">
              <HeroCard
                icon={<Zap className="h-5 w-5 text-accent" />}
                label="Supplier"
                title="Mama Mboga Supplies Ltd"
                detail="Invoice #1042 · 100 USDC · Pending funding"
                status="Pending"
              />
              <HeroCard
                icon={<Shield className="h-5 w-5 text-accent" />}
                label="Investor"
                title="Yield opportunity"
                detail="5.26% return · Maturity in 30 days"
                status="Funded"
                offset
              />
              <HeroCard
                icon={<ArrowRight className="h-5 w-5 text-accent" />}
                label="Buyer"
                title="Naivas Corporate"
                detail="Repayment due · Auto-split to investor"
                status="Repaid"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroCard({
  icon,
  label,
  title,
  detail,
  status,
  offset,
}: {
  icon: ReactNode
  label: string
  title: string
  detail: string
  status: string
  offset?: boolean
}) {
  const statusClass =
    status === 'Pending'
      ? 'badge-pending'
      : status === 'Funded'
        ? 'badge-funded'
        : 'badge-repaid'

  return (
    <div
      className={`theme-panel-box rounded-sm border bg-white/90 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-md ${
        offset ? 'ml-8' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center border theme-border bg-stellar/5">
            {icon}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-subtle">{label}</p>
            <p className="mt-1 font-semibold theme-heading">{title}</p>
            <p className="mt-1 text-sm text-subtle">{detail}</p>
          </div>
        </div>
        <span className={statusClass}>{status}</span>
      </div>
    </div>
  )
}
