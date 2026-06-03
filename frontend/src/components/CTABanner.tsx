import { Link } from 'react-router-dom'

export function CTABanner() {
  return (
    <section className="cta-banner border-t theme-border py-16 lg:py-20">
      <div className="landing-cta-inner mx-auto max-w-7xl px-6 text-center lg:px-10">
        <p className="landing-shift text-xs uppercase tracking-[0.35em] cta-banner-muted">Ready to begin</p>
        <h2 className="landing-shift mt-4 font-serif text-3xl font-semibold md:text-4xl">
          Find the dashboard built for your role
        </h2>
        <p className="landing-shift mx-auto mt-4 max-w-xl text-base leading-7 cta-banner-muted">
          Tell us if you are a supplier, investor, or buyer — we will take you to the right place.
        </p>
        <div className="mt-8">
          <Link
            to="/get-started"
            className="cta-banner-btn inline-flex items-center justify-center px-10 py-3 text-sm font-medium uppercase tracking-[0.15em] transition"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  )
}
