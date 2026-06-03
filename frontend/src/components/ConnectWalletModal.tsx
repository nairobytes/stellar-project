import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, X, Smartphone, Monitor } from 'lucide-react'
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
  description = 'InvoiceFi uses Stellar Testnet. Connect before choosing a dashboard so invoices and payments are tied to your account.',
  allowClose = true,
}: ConnectWalletModalProps) {
  const {
    connect,
    isLoading,
    error,
    isConnected,
    isMobile,
    walletConnectEnabled,
    freighterAvailable,
  } = useWallet()

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

  const mobileHint = isMobile ? (
    <div className="mt-6 border theme-border theme-accent-wash p-4 text-sm leading-7 theme-muted">
      <p className="flex items-center gap-2 font-medium theme-heading">
        <Smartphone className="h-4 w-4 text-accent" />
        On mobile
      </p>
      {walletConnectEnabled ? (
        <p className="mt-2">
          Tap <strong className="text-accent">Choose wallet</strong> and pick{' '}
          <strong className="text-accent">WalletConnect</strong> to pair Freighter, xBull, Lobstr, or
          other Stellar wallets on your phone. You can also use a wallet&apos;s in-app browser if it
          wraps this site.
        </p>
      ) : (
        <p className="mt-2">
          WalletConnect is not configured for this deployment. Use a wallet&apos;s in-app browser, or
          ask your operator to set <code className="text-xs">VITE_WALLET_CONNECT_PROJECT_ID</code>{' '}
          (free at{' '}
          <a
            href="https://cloud.reown.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            Reown Cloud
          </a>
          ).
        </p>
      )}
    </div>
  ) : (
    <div className="mt-6 flex items-start gap-2 text-sm theme-muted">
      <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p>
        Desktop: choose <strong className="text-accent">Freighter</strong> (extension),{' '}
        <strong className="text-accent">Albedo</strong>, or another listed wallet. Mobile users can use
        WalletConnect when enabled.
      </p>
    </div>
  )

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

        {mobileHint}

        {!freighterAvailable && !isMobile && (
          <p className="alert-error mt-4 text-sm">
            Freighter extension not detected — you can still connect via Albedo or WalletConnect in the
            wallet picker.
          </p>
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
            disabled={isLoading}
            className="btn-primary flex-1 justify-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isLoading ? 'Connecting…' : 'Choose wallet'}
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
