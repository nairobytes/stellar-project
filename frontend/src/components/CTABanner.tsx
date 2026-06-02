import { Link } from 'react-router-dom'

export function CTABanner() {
  return (
    <section className="border-t theme-border bg-stellar py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">Ready to begin</p>
        <h2 className="mt-4 font-serif text-3xl font-semibold text-white md:text-4xl">
          Find the dashboard built for your role
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/80">
          Tell us if you are a supplier, investor, or buyer — we will take you to the right place.
        </p>
        <div className="mt-8">
          <Link
            to="/get-started"
            className="inline-flex items-center justify-center bg-white px-10 py-3 text-sm font-medium uppercase tracking-[0.15em] text-stellar transition hover:bg-white/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  )
}
