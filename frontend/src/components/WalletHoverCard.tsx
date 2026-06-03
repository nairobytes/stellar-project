import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ChevronDown } from 'lucide-react'
import { NETWORK_LABEL } from '../config'
import { truncateAddress } from '../utils/format'

interface WalletHoverCardProps {
  account: string
  balance: string
  showSettingsLink?: boolean
  onNavigate?: () => void
  className?: string
}

export function WalletHoverCard({
  account,
  balance,
  showSettingsLink = false,
  onNavigate,
  className = '',
}: WalletHoverCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-2 border theme-border px-3 py-2 text-xs uppercase tracking-[0.12em] text-accent transition hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] ${className}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <Wallet className="h-4 w-4 shrink-0" />
        <span className="font-mono normal-case tracking-normal">
          {truncateAddress(account, 4, 4)}
        </span>
        <span className="normal-case tracking-normal text-subtle">· ${balance}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute right-0 top-full z-[60] pt-2 transition-all duration-200 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="min-w-[16rem] border theme-border theme-card p-4 shadow-lg">
          <p className="text-[10px] uppercase tracking-[0.25em] text-subtle">Wallet</p>

          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Address</p>
              <p className="mt-1 break-all font-mono text-xs leading-5 text-accent">{account}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Network</p>
              <p className="mt-1 text-sm font-medium theme-heading">{NETWORK_LABEL}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">USDC balance</p>
              <p className="mt-1 font-display text-lg font-semibold text-accent">${balance}</p>
            </div>
          </div>

          {showSettingsLink && (
            <Link
              to="/settings"
              onClick={onNavigate}
              className="mt-4 block text-center text-xs uppercase tracking-[0.15em] text-accent hover:underline"
            >
              Wallet settings →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
