import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'

interface DashboardTopBarProps {
  onOpenSidebar: () => void
}

export function DashboardTopBar({ onOpenSidebar }: DashboardTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b theme-border theme-header px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 items-center justify-center border theme-border text-accent lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 transition hover:opacity-90 lg:hidden">
          <Logo className="h-7 w-auto" />
          <span className="font-display text-base font-bold text-accent">InvoiceFi</span>
        </Link>
      </div>
      <ThemeToggle />
    </header>
  )
}
