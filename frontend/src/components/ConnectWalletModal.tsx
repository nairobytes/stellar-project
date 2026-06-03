import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, X, ExternalLink } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { PREVIEW_MODE, NETWORK_LABEL } from '../config'

interface ConnectWalletModalProps {
  open: boolean
  onClose?: () => void
  title?: string
  description?: string
  allowClose?: boolean
}

export function ConnectWalletModal({
  open,
  onClose,
  title = 'Connect your wallet',
  description = 'InvoiceFi uses Freighter on Stellar Testnet. Connect before choosing a dashboard so your invoices and payments are tied to your account.',
  allowClose = true,
}: ConnectWalletModalProps) {
  const { connect, isLoading, error, freighterAvailable, isConnected } = useWallet()

  useEffect(() => {
    if (isConnected && open) {
      onClose?.()
    }
  }, [isConnected, open, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && allowClose) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, allowClose, onClose])

  if (!open || PREVIEW_MODE) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-wallet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--heading)_55%,transparent)] backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={allowClose ? onClose : undefined}
      />

      <div className="relative z-10 w-full max-w-md border theme-border theme-card p-8 shadow-xl">
        {allowClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center border theme-border text-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex h-12 w-12 items-center justify-center border theme-border theme-accent-wash">
          <Wallet className="h-6 w-6 text-accent" />
        </div>

        <h2 id="connect-wallet-title" className="mt-6 font-serif text-2xl font-semibold theme-heading">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 theme-muted">{description}</p>

        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-subtle">
          Network: {NETWORK_LABEL}
        </p>

        {!freighterAvailable && (
          <div className="alert-error mt-6 text-sm">
            <p className="font-medium">Freighter not detected</p>
            <p className="mt-2">
              Install the extension, then refresh this page.
            </p>
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
            >
              Get Freighter
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void connect()}
            disabled={isLoading || !freighterAvailable}
            className="btn-primary flex-1 justify-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isLoading ? 'Connecting…' : 'Connect Freighter'}
          </button>
          <Link
            to="/"
            onClick={onClose}
            className="btn-ghost flex-1 justify-center text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
