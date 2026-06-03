import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
    <div className="landing-page min-h-screen theme-bg">
      <Header />

      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeaturesSection />
      <WhyStellar />
      <FaqSection />
      <CTABanner />

      <Footer />
    </div>
  )
}
