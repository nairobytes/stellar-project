import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b theme-border">
      <div className="hero-mesh absolute inset-0" aria-hidden />
      <div className="hero-gradient absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="landing-hover-block max-w-2xl animate-fade-up">
          <h1 className="heading-serif landing-shift">
            Turn invoices into
            <span className="text-accent block landing-shift">instant liquidity.</span>
          </h1>

          <p className="landing-shift mt-6 text-base leading-8 theme-muted md:text-lg">
            InvoiceFi connects Kenyan suppliers, yield-seeking investors, and corporate
            buyers on Stellar. Smart contracts hold USDC in escrow and distribute funds
            automatically — no banks, no paper, no delays.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              to="/get-started"
              className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
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
            <div className="landing-mini-stat">
              <p className="landing-shift font-display text-2xl font-bold text-accent md:text-3xl">3–5s</p>
              <p className="landing-shift mt-1 text-xs uppercase tracking-[0.2em] text-subtle">Settlement</p>
            </div>
            <div className="landing-mini-stat">
              <p className="landing-shift font-display text-2xl font-bold text-accent md:text-3xl">~$0.00001</p>
              <p className="landing-shift mt-1 text-xs uppercase tracking-[0.2em] text-subtle">Per transaction</p>
            </div>
            <div className="landing-mini-stat">
              <p className="landing-shift font-display text-2xl font-bold text-accent md:text-3xl">24/7</p>
              <p className="landing-shift mt-1 text-xs uppercase tracking-[0.2em] text-subtle">On-chain escrow</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
