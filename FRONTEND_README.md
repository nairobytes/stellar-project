# InvoiceFi - On-Chain Invoice Financing Platform

## Project Structure

```
stellar-project/
├── src/
│   ├── components/
│   │   ├── Header.tsx                # Top navigation with wallet info
│   │   ├── DashboardTabs.tsx          # Tab navigation for three dashboards
│   │   ├── SupplierDashboard.tsx      # Supplier dashboard
│   │   ├── InvestorDashboard.tsx      # Investor dashboard
│   │   ├── BuyerDashboard.tsx         # Buyer dashboard
│   │   ├── CreateInvoiceForm.tsx      # Create invoice form
│   │   ├── FundInvoiceForm.tsx        # Fund invoice form
│   │   ├── RepayInvoiceForm.tsx       # Repay invoice form
│   │   └── InvoiceTable.tsx           # Reusable invoice table
│   ├── hooks/
│   │   ├── useWallet.ts              # Wallet management hook
│   │   └── useInvoices.ts            # Invoice data fetching hooks
│   ├── utils/
│   │   ├── soroban.ts                # Soroban contract utilities
│   │   ├── stellar.ts                # Stellar SDK utilities
│   │   └── format.ts                 # Formatting utilities
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── config.ts                     # Configuration and constants
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles
├── index.html                        # HTML template
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind CSS config
└── postcss.config.js                 # PostCSS config
```

## Features

### Supplier Dashboard
- Connect wallet using Freighter API
- Create invoices with buyer address, amount, discount rate, and due date
- View all created invoices in a table
- Track invoice status (Pending, Funded, Repaid, Overdue, Defaulted)
- See funded amount and maturity date for each invoice

### Investor Dashboard
- Browse all pending invoices available for funding
- View invoice details including supplier credit score
- See expected yield based on investor yield rate (5%)
- Fund invoices by clicking FUND button
- Track funded invoices

### Buyer Dashboard
- View invoices where connected wallet is the buyer
- See amount owed and due date
- Repay invoices by clicking PAY button
- Track payment status and days until maturity

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Wallet**: @stellar/freighter-api
- **Blockchain**: Stellar SDK + Soroban RPC
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Freighter wallet browser extension

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure contract address in `src/config.ts`:
```typescript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'
export const USDC_ADDRESS = 'YOUR_USDC_TOKEN_ADDRESS'
```

3. Start development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## Contract Functions

The frontend interacts with the following Soroban contract functions:

- `create_invoice(supplier, buyer, amount, discount_bps, maturity_time)` - Create new invoice
- `fund_invoice(invoice_id, investor, usdc_contract, amount)` - Fund an invoice
- `repay_invoice(invoice_id, buyer, usdc_contract, repayment_amount)` - Repay invoice
- `get_invoice(invoice_id)` - Get invoice details
- `get_supplier_invoices(supplier)` - Get supplier's invoices
- `get_credit_score(supplier)` - Get supplier credit score
- `mark_overdue(invoice_id)` - Mark invoice as overdue
- `mark_defaulted(invoice_id)` - Mark invoice as defaulted
- `update_credit_score(supplier, new_score)` - Update credit score

## Network Configuration

- **Network**: Stellar Testnet
- **RPC URL**: https://soroban-testnet.stellar.org
- **Horizon URL**: https://horizon-testnet.stellar.org
- **Network Passphrase**: Test SDF Network ; September 2015

## Key Concepts

### Stroops
USDC amounts are stored in stroops (1 USDC = 10,000,000 stroops). The utility functions handle conversion.

### Basis Points
Discount rates and yield are stored in basis points (1 basis point = 0.01%). 500 basis points = 5%.

### Invoice Lifecycle
1. **Pending** - Created by supplier, awaiting funding
2. **Funded** - Investor has funded the full amount
3. **Repaid** - Buyer repaid the invoice with yield to investor
4. **Overdue** - Maturity date passed, not yet repaid
5. **Defaulted** - Invoice marked as defaulted

## Usage Tips

1. Test with Testnet USDC tokens
2. Use the same wallet for testing multiple roles (supply, invest, buy)
3. Check contract events for transaction status
4. Monitor USDC balance in header
5. Use mock data during development - replace with actual contract calls

## TODO / Next Steps

- [ ] Implement actual Soroban contract calls (currently using mock data)
- [ ] Add transaction signing with Freighter
- [ ] Implement USDC balance fetching from blockchain
- [ ] Add transaction history and events
- [ ] Implement credit score algorithm
- [ ] Add default risk assessment
- [ ] Add analytics dashboard
- [ ] Implement notification system for contract events
- [ ] Add more detailed error handling
- [ ] Deploy to production Stellar network

## Support

For issues or questions, refer to:
- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter API Docs](https://github.com/stellar/freighter)
- [Soroban Documentation](https://soroban.stellar.org/)
