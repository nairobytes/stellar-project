import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { PREVIEW_MODE, NETWORK_LABEL } from '../config'
import { useWallet } from '../hooks/useWallet'
import { Wallet, LogOut, Menu, X, Home, ArrowLeftRight, Settings } from 'lucide-react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { ConnectWalletModal } from './ConnectWalletModal'
import { WalletHoverCard } from './WalletHoverCard'
import { isDashboardShellPath } from '../constants/dashboard'

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

  if (isDashboardShellPath(pathname)) {
    return null
  }

  const isDashboard = dashboardPaths.includes(pathname)
  const isGetStartedPage = pathname === '/get-started'
  const showMarketingNav = !isDashboard && !isGetStartedPage
  const showSettings = isDashboard || pathname === '/settings'
  const currentRoleLabel = dashboardRoleLabels[pathname]
  const [menuOpen, setMenuOpen] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const { account, isConnected, balance, isLoading, disconnect } = useWallet()

  const closeMenu = () => setMenuOpen(false)

  const openConnect = () => {
    setConnectModalOpen(true)
    closeMenu()
  }

  const walletControl = isConnected && account ? (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
      <WalletHoverCard
        account={account}
        balance={balance}
        showSettingsLink={showSettings}
        onNavigate={closeMenu}
      />
      <button
        type="button"
        onClick={() => {
          disconnect()
          closeMenu()
        }}
        disabled={isLoading}
        className="btn-ghost flex w-full items-center justify-center gap-2 lg:w-auto lg:!px-3 lg:!py-2"
        aria-label="Disconnect wallet"
      >
        <LogOut className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.15em]">Disconnect</span>
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => {
        if (PREVIEW_MODE) return
        openConnect()
      }}
      disabled={isLoading || PREVIEW_MODE}
      title={PREVIEW_MODE ? 'Wallet connect disabled in preview mode' : undefined}
      className={`btn-primary inline-flex items-center justify-center gap-2 !px-4 !py-2 text-xs uppercase tracking-[0.12em] ${
        PREVIEW_MODE ? 'cursor-not-allowed opacity-40' : ''
      }`}
      aria-label="Connect wallet"
    >
      <Wallet className="h-4 w-4 shrink-0" />
      {isLoading ? 'Connecting…' : 'Connect wallet'}
    </button>
  )

  return (
    <>
      <ConnectWalletModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
      />

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

          {isGetStartedPage && (
            <nav
              className="hidden min-w-0 flex-1 items-center justify-center lg:flex"
              aria-label="Get started navigation"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-subtle transition hover:text-accent"
              >
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
            </nav>
          )}

          {showMarketingNav && (
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
            {showSettings && (
              <Link
                to="/settings"
                className={`hidden items-center gap-1.5 border theme-border px-3 py-2 text-xs uppercase tracking-[0.15em] transition hover:text-accent sm:inline-flex ${
                  pathname === '/settings' ? 'text-accent font-semibold' : 'text-subtle'
                }`}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Settings</span>
              </Link>
            )}

            {showMarketingNav && (
              <Link
                to="/get-started"
                className="btn-ghost hidden !px-4 !py-2 text-xs sm:inline-flex"
              >
                Get started
              </Link>
            )}

            <div className="hidden sm:block">{walletControl}</div>

            <ThemeToggle />

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border theme-border text-accent sm:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t theme-border theme-header sm:hidden">
            <nav className="flex flex-col gap-1 px-4 py-4">
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

              {showSettings && (
                <Link
                  to="/settings"
                  onClick={closeMenu}
                  className={`inline-flex items-center gap-2 px-3 py-3 text-sm uppercase tracking-[0.2em] ${
                    pathname === '/settings' ? 'font-semibold text-accent' : 'theme-muted'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              )}

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
              ) : isGetStartedPage ? null : (
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

              <div className="mt-4 border-t theme-border pt-4">
                {isConnected && account ? (
                  <div className="space-y-3 px-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Connected wallet</p>
                    <p className="break-all font-mono text-xs text-accent">{account}</p>
                    <p className="text-sm theme-muted">
                      Network: <span className="text-accent">{NETWORK_LABEL}</span>
                    </p>
                    <p className="text-sm theme-muted">
                      USDC: <span className="font-semibold text-accent">${balance}</span>
                    </p>
                    {showSettings && (
                      <Link
                        to="/settings"
                        onClick={closeMenu}
                        className="text-xs uppercase tracking-[0.15em] text-accent"
                      >
                        Wallet settings →
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        disconnect()
                        closeMenu()
                      }}
                      disabled={isLoading}
                      className="btn-ghost flex w-full items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  walletControl
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
