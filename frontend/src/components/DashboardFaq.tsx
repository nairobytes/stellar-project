import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faqsForRole, type FaqItem } from '../content/dashboardFaq'

interface DashboardFaqProps {
  role: 'supplier' | 'investor' | 'buyer'
}

export function DashboardFaq({ role }: DashboardFaqProps) {
  const faqs = faqsForRole(role)
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="mt-14 border-t theme-border pt-12" aria-labelledby={`${role}-faq-heading`}>
      <div className="mb-8">
        <p className="section-label mb-3">FAQ</p>
        <h2
          id={`${role}-faq-heading`}
          className="font-serif text-2xl font-semibold theme-heading md:text-3xl"
        >
          {role === 'supplier' && 'Supplier dashboard'}
          {role === 'investor' && 'Investor dashboard'}
          {role === 'buyer' && 'Buyer dashboard'}
          {' — '}
          common questions
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 theme-muted">
          What you can and cannot do on-chain for this role. Invoice records cannot be edited or
          deleted after creation.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <FaqRow
            key={faq.q}
            faq={faq}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>
    </section>
  )
}

function FaqRow({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="landing-faq-item border theme-border theme-surface">
      <button
        type="button"
        onClick={onToggle}
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
        <p className="border-t theme-border px-6 pb-5 text-sm leading-7 text-subtle">{faq.a}</p>
      )}
    </div>
  )
}
