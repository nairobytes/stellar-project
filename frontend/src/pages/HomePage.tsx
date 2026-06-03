import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { StatsBar } from '../components/StatsBar'
import { HowItWorks } from '../components/HowItWorks'
import { FeaturesSection } from '../components/FeaturesSection'
import { WhyStellar } from '../components/WhyStellar'
import { FaqSection } from '../components/FaqSection'
import { CTABanner } from '../components/CTABanner'
import { Footer } from '../components/Footer'

export function HomePage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [hash])

  return (
    <div className="min-h-screen theme-bg">
      <Header />

      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeaturesSection />
      <WhyStellar />
      <FaqSection />
      <CTABanner />

      <section id="app" className="scroll-mt-24 border-t theme-border theme-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
          <p className="section-label mb-3">Live application</p>
          <h2 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">
            Open your dashboard
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 theme-muted">
            Are you a buyer, supplier, or investor? We will guide you to the right workspace.
          </p>
          <div className="mt-10">
            <Link to="/get-started" className="btn-primary inline-flex">
              Get started
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
