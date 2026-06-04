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
    if (!open) {
      document.body.style.overflow = ''
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && allowClose) onClose?.()
    }
    document.addEventListener('keydown', onKey)

    const isNarrow = window.matchMedia('(max-width: 1023px)').matches
    const prevOverflow = document.body.style.overflow
    if (!isNarrow) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, allowClose, onClose])

  if (!open || PREVIEW_MODE) return null

  const mobileHint = isMobile ? (
    <div className="mt-6 border theme-border theme-accent-wash p-4 text-sm leading-7 theme-muted">
      <p className="flex items-center gap-2 font-medium theme-heading">
        <Smartphone className="h-4 w-4 text-accent" />
        Freighter on your phone
      </p>
      <p className="mt-2">
        Having the Freighter <strong className="text-accent">app installed</strong> does not connect it
        to Chrome automatically. The list may show <strong className="text-accent">Install</strong>{' '}
        next to Freighter — that is normal in mobile browsers.
      </p>
      {walletConnectEnabled ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Tap <strong className="text-accent">Choose wallet</strong> below, then pick{' '}
            <strong className="text-accent">WalletConnect</strong>.
          </li>
          <li>Select <strong className="text-accent">Freighter</strong> and approve the connection in the app.</li>
          <li>Confirm the wallet is on <strong className="text-accent">Stellar Testnet</strong>.</li>
          <li>
            If connect fails, add{' '}
            <code className="text-xs break-all">{window.location.origin}</code> under{' '}
            <strong className="text-accent">Allowed origins</strong> at{' '}
            <a
              href="https://cloud.reown.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-4 hover:underline"
            >
              cloud.reown.com
            </a>
            , then try again.
          </li>
        </ol>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="font-medium theme-heading">Option A — Freighter in-app browser (no extra setup)</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open the <strong className="text-accent">Freighter</strong> app (not Chrome).</li>
            <li>
              Use its browser / Discover tab and go to your dev URL, e.g.{' '}
              <code className="text-xs break-all">{window.location.origin}</code>
            </li>
            <li>Connect again — Freighter should appear as available, not Install.</li>
          </ol>
          <p className="font-medium theme-heading">Option B — WalletConnect in Chrome</p>
          <p>
            Add a free project id from{' '}
            <a
              href="https://cloud.reown.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-4 hover:underline"
            >
              Reown Cloud
            </a>{' '}
            to <code className="text-xs">VITE_WALLET_CONNECT_PROJECT_ID</code> in{' '}
            <code className="text-xs">frontend/.env</code>, restart{' '}
            <code className="text-xs">npm run dev</code>, then use WalletConnect in the wallet list.
          </p>
          <p className="font-medium theme-heading">Option C — Albedo</p>
          <p>Tap <strong className="text-accent">Albedo</strong> in the list (works in Chrome without the Freighter app).</p>
        </div>
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

  const handleConnect = () => {
    document.body.style.overflow = ''
    void connect()
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-wallet-title"
    >
      <div className="flex min-h-full justify-center p-4 py-6 sm:items-center sm:py-8">
        <button
          type="button"
          className="fixed inset-0 bg-[color-mix(in_srgb,var(--heading)_55%,transparent)] backdrop-blur-sm"
          aria-label="Close dialog"
          onClick={allowClose ? onClose : undefined}
        />

        <div className="relative z-10 my-auto w-full max-w-md max-h-[min(90dvh,calc(100%-2rem))] overflow-y-auto border theme-border theme-card p-6 shadow-xl sm:max-h-[90vh] sm:p-8">
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
            onClick={handleConnect}
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
    </div>
  )
}
