export type FaqItem = { q: string; a: string }

export const sharedFaqs: FaqItem[] = [
  {
    q: 'Can I edit or delete an invoice after creating it?',
    a: 'No. Invoices are immutable once submitted to the Soroban contract. There is no edit or delete function in the smart contract or this app. If details are wrong, leave the incorrect invoice unfunded (while it is still Pending) and create a new one with the correct buyer, amount, discount, and due date.',
  },
  {
    q: 'Which wallet do I need?',
    a: 'Install the Freighter browser extension, switch to Stellar Testnet, and connect from the header. Your public key is your on-chain identity — InvoiceFi never stores private keys.',
  },
  {
    q: 'What currency is used?',
    a: 'USDC on Stellar Testnet. Amounts are stored in stroops inside the contract (1 USDC = 10,000,000 stroops).',
  },
]

export const supplierFaqs: FaqItem[] = [
  {
    q: 'What can I do on the supplier dashboard?',
    a: 'Create new invoices, view your pipeline (pending, funded, repaid), and track all invoices tied to your wallet. You cannot change or remove invoices after they are on-chain.',
  },
  {
    q: 'What happens after I create an invoice?',
    a: 'The invoice is stored with Pending status. Investors can fund it on the investor dashboard. When funded, USDC is sent to you minus the discount. The buyer repays at maturity.',
  },
  {
    q: 'Can I cancel a funded invoice?',
    a: 'No. After an investor funds an invoice, funds are in escrow and the lifecycle continues until the buyer repays or the invoice is marked overdue/defaulted by the contract rules.',
  },
]

export const investorFaqs: FaqItem[] = [
  {
    q: 'What can I do on the investor dashboard?',
    a: 'Browse Pending invoices, fund them with USDC from your wallet, and see yield and supplier credit context. You cannot edit invoice terms — only fund what the supplier already listed.',
  },
  {
    q: 'Can I undo funding after I fund an invoice?',
    a: 'No. Funding transfers USDC into contract escrow and pays the supplier immediately. The investment stays locked until the buyer repays at maturity.',
  },
  {
    q: 'How does investor yield work?',
    a: 'The contract targets 5% (500 basis points) on principal when the buyer repays the full face value. Yield is enforced on-chain, not adjusted in the dashboard.',
  },
]

export const buyerFaqs: FaqItem[] = [
  {
    q: 'What can I do on the buyer dashboard?',
    a: 'View invoices where you are the named buyer, see amounts and due dates, and repay Funded or Overdue obligations. You cannot edit invoice amounts or parties — only repay what was created on-chain.',
  },
  {
    q: 'Can I change the repayment amount?',
    a: 'Repayment must match the invoice face value stored in the contract. Use the repay form with the correct invoice ID and full USDC amount; partial edits to invoice data are not supported.',
  },
  {
    q: 'Who can repay an invoice?',
    a: 'Only the buyer address recorded on the invoice can call repay_invoice. The contract rejects repayments from other wallets.',
  },
]

export function faqsForRole(role: 'supplier' | 'investor' | 'buyer'): FaqItem[] {
  const roleFaqs =
    role === 'supplier' ? supplierFaqs : role === 'investor' ? investorFaqs : buyerFaqs
  return [...sharedFaqs, ...roleFaqs]
}
