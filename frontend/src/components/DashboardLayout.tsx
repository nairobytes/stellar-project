import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { PreviewBanner } from './PreviewBanner'

interface DashboardLayoutProps {
  role: string
  title: string
  description: string
  children: ReactNode
}

export function DashboardLayout({ role, title, description, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen theme-bg">
      <Header />
      <main className="scroll-mt-24 min-w-0 border-t theme-border theme-surface">
        <div className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="mb-10">
            <p className="section-label mb-3">{role}</p>
            <h1 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 theme-muted">{description}</p>
          </div>

          <div className="mt-8">
            <PreviewBanner />
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
