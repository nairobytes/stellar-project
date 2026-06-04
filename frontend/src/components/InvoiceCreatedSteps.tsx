const steps = [
  {
    title: 'Pending on-chain',
    body: 'After you sign in your wallet, the Soroban contract stores the invoice with status Pending. It appears in Your invoices below.',
  },
  {
    title: 'Investors can fund',
    body: 'On the investor dashboard, funders browse pending invoices. When one funds yours, USDC moves into escrow and you receive the discounted amount (face value minus the rate you set).',
  },
  {
    title: 'Buyer repays at due date',
    body: 'The buyer listed on the invoice repays the full face value in USDC before or on the due date you chose. The contract pays the investor principal plus yield.',
  },
  {
    title: 'Repaid in your pipeline',
    body: 'When repayment completes, status becomes Repaid. You can track pending, funded, and repaid counts in Your pipeline. Invoices cannot be edited or deleted once created.',
  },
]

export function InvoiceCreatedSteps() {
  return (
    <div className="border-t theme-border pt-5">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-subtle">
        What happens after you create an invoice
      </p>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center border theme-border text-xs font-semibold text-accent"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold theme-heading">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-subtle">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
