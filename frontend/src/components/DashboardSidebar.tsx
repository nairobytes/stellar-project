import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  Settings,
  LogOut,
  Wallet,
  X,
} from 'lucide-react'
import { PREVIEW_MODE, NETWORK_LABEL } from '../config'
import { useWallet } from '../hooks/useWallet'
import { DASHBOARD_ROLE_LABELS } from '../constants/dashboard'
import { Logo } from './Logo'

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

function sidebarLinkClass(active: boolean) {
  return active
    ? 'bg-white/15 font-semibold text-white'
    : 'text-white/80 hover:bg-white/10 hover:text-white'
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const { pathname } = useLocation()
  const { account, isConnected, balance, isLoading, disconnect, connect } = useWallet()

  const currentRoleLabel = DASHBOARD_ROLE_LABELS[pathname]
  const isSettings = pathname === '/settings'

  const navItem = (to: string, label: string, icon: ReactNode, active: boolean) => (
    <Link
      to={to}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-sm px-4 py-3 text-sm uppercase tracking-[0.12em] transition ${sidebarLinkClass(active)}`}
    >
      {icon}
      {label}
    </Link>
  )

  return (
    <aside
      className={`dashboard-sidebar fixed inset-y-0 left-0 z-50 flex h-screen max-h-screen w-[min(18rem,85vw)] flex-col border-r border-white/10 shadow-xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:w-72 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Dashboard navigation"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
        <Link to="/" onClick={onClose} className="flex items-center gap-2.5 transition hover:opacity-90">
          <Logo className="h-8 w-auto brightness-0 invert" />
          <span className="font-display text-lg font-bold leading-none text-white">InvoiceFi</span>
        </Link>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center text-white/90 transition hover:bg-white/10 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItem('/', 'Home', <Home className="h-4 w-4 shrink-0" />, false)}

        {currentRoleLabel && (
          <span
            className={`flex items-center gap-3 rounded-sm px-4 py-3 text-sm uppercase tracking-[0.12em] ${sidebarLinkClass(true)}`}
          >
            <span className="h-4 w-4 shrink-0 rounded-full bg-white/90" aria-hidden />
            {currentRoleLabel}
          </span>
        )}

        {navItem(
          '/get-started',
          'Switch role',
          <ArrowLeftRight className="h-4 w-4 shrink-0" />,
          false,
        )}

        {navItem(
          '/settings',
          'Settings',
          <Settings className="h-4 w-4 shrink-0" />,
          isSettings,
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        {isConnected && account ? (
          <div className="space-y-4">
            <div className="rounded-sm bg-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Wallet</p>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-white">{account}</p>
              <p className="mt-3 text-xs text-white/70">
                Network: <span className="font-medium text-white">{NETWORK_LABEL}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                ${balance} <span className="text-white/60 font-normal">USDC</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                disconnect()
                onClose()
              }}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 border border-white/25 px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (PREVIEW_MODE) return
              void connect()
            }}
            disabled={isLoading || PREVIEW_MODE}
            className="flex w-full items-center justify-center gap-2 bg-white px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-[#1a4d7a] transition hover:bg-white/90 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {isLoading ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>
    </aside>
  )
}
