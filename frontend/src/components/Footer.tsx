import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { CONTRACT_ADDRESS } from '../config'
import { truncateAddress } from '../utils/format'

const quickLinks = [
  { label: 'Get started', to: '/get-started' },
  { label: 'Supplier', to: '/supplier' },
  { label: 'Investor', to: '/investor' },
  { label: 'Buyer', to: '/buyer' },
]

const resources = [
  { label: 'Stellar Docs', href: 'https://developers.stellar.org/' },
  { label: 'Soroban Docs', href: 'https://soroban.stellar.org/' },
  { label: 'Get Freighter', href: 'https://www.freighter.app/' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t theme-border theme-bg mt-16">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link to="/" className="inline-block transition hover:opacity-90">
              <Logo className="h-14 w-auto" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 theme-muted">
              Decentralised invoice financing for Kenyan SMEs — built on Stellar &amp;
              Soroban. No middlemen, no delays, full on-chain audit trail.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-subtle">
              Network: Stellar Testnet
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.25em] text-accent">Dashboards</h3>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm theme-muted transition hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.25em] text-accent">Resources</h3>
            <ul className="mt-5 space-y-3">
              {resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm theme-muted transition hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t theme-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs theme-muted">
            © {year} InvoiceFi. All rights reserved.
          </p>
          <p className="break-all text-xs theme-muted">
            Contract:{' '}
            <span className="font-mono text-accent">{truncateAddress(CONTRACT_ADDRESS, 8, 6)}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
