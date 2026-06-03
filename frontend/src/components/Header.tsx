import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { PREVIEW_MODE } from '../config'
import { useWallet } from '../hooks/useWallet'
import { Wallet, LogOut, Menu, X, Home, ArrowLeftRight } from 'lucide-react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const dashboardNav = [
  { label: 'Supplier', path: '/supplier' },
  { label: 'Investor', path: '/investor' },
  { label: 'Buyer', path: '/buyer' },
]

const dashboardRoleLabels: Record<string, string> = {
  '/supplier': 'Supplier dashboard',
  '/investor': 'Investor dashboard',
  '/buyer': 'Buyer dashboard',
}

const marketingNav = [
  { label: 'Get started', path: '/get-started' },
  { label: 'How it works', path: '/#how-it-works' },
  { label: 'Features', path: '/#features' },
  { label: 'FAQ', path: '/#faq' },
]

const dashboardPaths = ['/supplier', '/investor', '/buyer']

function navLinkClass(isActive: boolean) {
  return isActive
    ? 'font-semibold text-accent'
    : 'text-subtle hover:text-accent'
}

export function Header() {
  const { pathname } = useLocation()
  const isDashboard = dashboardPaths.includes(pathname)
  const currentRoleLabel = dashboardRoleLabels[pathname]
  const [menuOpen, setMenuOpen] = useState(false)
  const { account, isConnected, balance, isLoading, connect, disconnect } = useWallet()

  const closeMenu = () => setMenuOpen(false)

  const walletControl = isConnected && account ? (
    <button
      type="button"
      onClick={() => {
        disconnect()
        closeMenu()
      }}
      disabled={isLoading}
      className="btn-ghost flex w-full items-center justify-center gap-2 lg:w-auto lg:!p-2"
      aria-label="Disconnect wallet"
    >
      <LogOut className="h-4 w-4" />
      <span className="lg:hidden">Disconnect</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={() => {
        void connect()
        closeMenu()
      }}
      disabled={isLoading || PREVIEW_MODE}
      title={PREVIEW_MODE ? 'Wallet connect disabled in preview mode' : undefined}
      className={`btn-ghost flex w-full items-center justify-center gap-2 lg:w-auto lg:!p-2 ${
        PREVIEW_MODE ? 'cursor-not-allowed opacity-40' : ''
      }`}
      aria-label="Connect wallet"
    >
      <Wallet className="h-4 w-4" />
      <span className="text-xs uppercase tracking-[0.15em] lg:hidden">
        {isLoading ? 'Connecting…' : 'Connect'}
      </span>
    </button>
  )

  return (
    <header className="sticky top-0 z-50 border-b theme-header backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:gap-4 lg:px-10">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90 sm:gap-3"
          onClick={closeMenu}
        >
          <Logo className="h-8 w-auto sm:h-9" />
          <span className="font-display text-lg font-bold leading-none text-accent sm:text-xl md:text-2xl">
            InvoiceFi
          </span>
        </Link>

        {/* Desktop: focused dashboard nav (home + current role + switch) */}
        {isDashboard && (
          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex"
            aria-label="Dashboard navigation"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-subtle transition hover:text-accent"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-accent">
              {currentRoleLabel}
            </span>
            <Link
              to="/get-started"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-subtle transition hover:text-accent"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch role
            </Link>
          </nav>
        )}

        {/* Desktop: marketing links */}
        {!isDashboard && (
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex">
            {marketingNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs uppercase tracking-[0.2em] transition ${
                  pathname === item.path ? 'font-semibold text-accent' : 'text-subtle hover:text-accent'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!isDashboard && (
            <Link
              to="/get-started"
              className="btn-primary hidden !px-4 !py-2 text-xs sm:inline-flex"
            >
              Get started
            </Link>
          )}

          {isConnected && account && (
            <span className="hidden text-sm font-semibold text-accent xl:inline">
              ${balance}
            </span>
          )}

          <ThemeToggle />

          <div className="hidden lg:block">{walletControl}</div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border theme-border text-accent lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t theme-border theme-header lg:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            <p className="section-label mb-2 px-1">Navigate</p>

            <Link
              to="/"
              onClick={closeMenu}
              className={`inline-flex items-center gap-2 px-3 py-3 text-sm uppercase tracking-[0.2em] ${
                pathname === '/' ? 'font-semibold text-accent' : 'theme-muted'
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>

            {isDashboard ? (
              <>
                <p className="px-3 py-2 text-xs uppercase tracking-[0.2em] font-semibold text-accent">
                  {currentRoleLabel}
                </p>
                <Link
                  to="/get-started"
                  onClick={closeMenu}
                  className="inline-flex items-center gap-2 px-3 py-3 text-sm uppercase tracking-[0.2em] theme-muted transition hover:text-accent"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Switch role
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/get-started"
                  onClick={closeMenu}
                  className={`px-3 py-3 text-sm uppercase tracking-[0.2em] ${
                    pathname === '/get-started' ? 'font-semibold text-accent' : 'theme-muted'
                  }`}
                >
                  Get started
                </Link>

                {marketingNav.slice(1).map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className="px-3 py-3 text-sm uppercase tracking-[0.2em] text-subtle hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ))}

                <p className="section-label mb-1 mt-4 px-1">Dashboards</p>
                {dashboardNav.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `px-3 py-3 text-sm uppercase tracking-[0.2em] transition ${navLinkClass(isActive)}`
                    }
                  >
                    {item.label} dashboard
                  </NavLink>
                ))}
              </>
            )}

            <div className="mt-4 border-t theme-border pt-4">{walletControl}</div>
          </nav>
        </div>
      )}
    </header>
  )
}
