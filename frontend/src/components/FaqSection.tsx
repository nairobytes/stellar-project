import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'What is InvoiceFi?',
    a: 'InvoiceFi is a decentralised invoice financing platform on Stellar. Suppliers tokenise receivables, investors fund them in USDC for yield, and buyers repay at maturity — all enforced by Soroban smart contracts.',
  },
  {
    q: 'Which wallet do I need?',
    a: 'Use the Freighter browser extension on desktop. Connect from the header, approve on Testnet, and your public key becomes your identity — we never hold private keys.',
  },
  {
    q: 'What currency is used?',
    a: 'USDC on Stellar Testnet is the settlement asset. Amounts are stored in stroops (1 USDC = 10,000,000 stroops) inside the contract.',
  },
  {
    q: 'How does investor yield work?',
    a: 'The contract pays investors 5% (500 basis points) on principal when the buyer repays. Yield is calculated and distributed automatically — no manual reconciliation.',
  },
  {
    q: 'Is this on mainnet?',
    a: 'The MVP runs on Stellar Testnet for development and demo. Deploying to mainnet is a configuration change once your contract is audited and funded.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="page-section border-t theme-border py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <div className="text-center">
          <p className="section-label mb-4">FAQ</p>
          <h2 className="font-serif text-3xl font-semibold theme-heading md:text-4xl">
            Common questions
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q} className="border theme-border bg-white">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-medium theme-heading">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-accent transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="border-t theme-border px-6 pb-5 text-sm leading-7 text-subtle">
                    {faq.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
