import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, LineChart, Store, ArrowRight } from 'lucide-react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ConnectWalletModal } from '../components/ConnectWalletModal'
import { useWallet } from '../hooks/useWallet'
import { PREVIEW_MODE } from '../config'

const roles = [
  {
    id: 'supplier',
    path: '/supplier',
    icon: Building2,
    title: 'Supplier',
    subtitle: 'I sell goods or services',
    description:
      'Create invoices, get funded early, and track repayments. Build your on-chain credit history.',
    cta: 'Go to supplier dashboard',
  },
  {
    id: 'investor',
    path: '/investor',
    icon: LineChart,
    title: 'Investor',
    subtitle: 'I want to earn yield',
    description:
      'Browse pending invoices, review credit scores, and fund opportunities in USDC escrow.',
    cta: 'Go to investor dashboard',
  },
  {
    id: 'buyer',
    path: '/buyer',
    icon: Store,
    title: 'Buyer',
    subtitle: 'I owe payments to suppliers',
    description:
      'View outstanding invoices, see due dates, and repay obligations when they mature.',
    cta: 'Go to buyer dashboard',
  },
]

export function GetStartedPage() {
  const navigate = useNavigate()
  const { isConnected } = useWallet()
  const walletRequired = !PREVIEW_MODE
  const [showWalletModal, setShowWalletModal] = useState(walletRequired && !isConnected)

  const canChooseRole = !walletRequired || isConnected

  useEffect(() => {
    if (isConnected) {
      setShowWalletModal(false)
    } else if (walletRequired) {
      setShowWalletModal(true)
    }
  }, [isConnected, walletRequired])

  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleRoleClick = (path: string) => {
    if (!canChooseRole) {
      setShowWalletModal(true)
      return
    }
    navigate(path)
  }

  return (
    <div className="min-h-screen theme-bg">
      <Header />

      <ConnectWalletModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        allowClose
        title="Connect before you continue"
        description="Link your Freighter wallet on Stellar Testnet first. Then you can pick supplier, investor, or buyer dashboard."
      />

      <main className="border-t theme-border theme-surface">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-label mb-4">Get started</p>
            <h1 className="font-serif text-3xl font-semibold theme-heading md:text-5xl">
              Are you a buyer, supplier, or investor?
            </h1>
            <p className="mt-5 text-base leading-7 theme-muted">
              {canChooseRole
                ? 'Choose your role to open the right dashboard. Your connected wallet signs all on-chain actions.'
                : 'Connect Freighter below to continue, then choose the dashboard that matches your role.'}
            </p>
            {walletRequired && !isConnected && (
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="btn-primary mt-8 inline-flex items-center gap-2"
              >
                Connect wallet to continue
              </button>
            )}
          </div>

          <div
            className={`mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3 ${
              canChooseRole ? '' : 'pointer-events-none opacity-50'
            }`}
            aria-hidden={!canChooseRole}
          >
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleClick(role.path)}
                  className="feature-card group flex flex-col border theme-border theme-surface p-8 text-left transition hover:border-stellar/50 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center border theme-border theme-accent-wash transition group-hover:[background-color:var(--accent-wash-strong)]">
                    <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                  </div>
                  <p className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">
                    {role.title}
                  </p>
                  <p className="mt-1 text-sm font-medium theme-heading">{role.subtitle}</p>
                  <p className="mt-4 flex-1 text-sm leading-7 text-subtle">{role.description}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
                    {role.cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </button>
              )
            })}
          </div>

          {!canChooseRole && (
            <p className="mt-6 text-center text-sm text-subtle">
              Role cards unlock after your wallet is connected.
            </p>
          )}

          <p className="mt-12 text-center text-sm text-subtle">
            Not sure?{' '}
            <Link to="/#how-it-works" className="text-accent underline-offset-4 hover:underline">
              See how InvoiceFi works
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
