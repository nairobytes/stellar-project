# InvoiceFi Frontend

React + TypeScript frontend for on-chain invoice financing on Stellar Testnet.

## Routes

| URL | Description |
|-----|-------------|
| `/` | Marketing landing page |
| `/get-started` | Choose role: supplier, investor, or buyer |
| `/supplier` | Create invoices, view pipeline |
| `/investor` | Browse and fund pending invoices |
| `/buyer` | View obligations and repay invoices |

Navigation uses **React Router**. The header shows role links on dashboard pages and **Get started** on the landing page.

## Project Structure

```text
src/
├── pages/
│   ├── HomePage.tsx
│   ├── GetStartedPage.tsx
│   ├── SupplierPage.tsx
│   ├── InvestorPage.tsx
│   └── BuyerPage.tsx
├── components/
│   ├── Header.tsx, Footer.tsx, Hero.tsx
│   ├── DashboardLayout.tsx, PreviewBanner.tsx
│   ├── SupplierDashboard.tsx, InvestorDashboard.tsx, BuyerDashboard.tsx
│   ├── CreateInvoiceForm.tsx, FundInvoiceForm.tsx, RepayInvoiceForm.tsx
│   └── InvoiceTable.tsx, FaqSection.tsx, …
├── hooks/
│   ├── useWallet.tsx      # Freighter wallet context
│   └── useInvoices.ts     # React Query + Soroban / mock data
├── utils/
│   ├── soroban.ts         # Contract RPC helpers
│   ├── stellar.ts         # Freighter + Horizon
│   └── format.ts
├── config.ts              # PREVIEW_MODE, env addresses, constants
├── App.tsx                # Router definition
└── main.tsx
```

## Preview Mode

In `src/config.ts`:

```typescript
export const PREVIEW_MODE = true  // set false for live Freighter + Soroban
```

When `true`:

- All three dashboards render with **sample invoices** (no wallet required).
- **Connect wallet** in the header is disabled.
- Form submits show a preview toast only.

When `false`:

- Hooks call real Soroban functions in `utils/soroban.ts`.
- User must connect Freighter and use Testnet USDC.

## Configuration

Prefer `.env` (see `.env.example`):

```env
VITE_CONTRACT_ADDRESS=
VITE_USDC_ADDRESS=
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

Values fall back to placeholders in `config.ts` if unset.

## Setup

```bash
npm install
cp .env.example .env   # optional
npm run dev
```

Open `http://localhost:3000` → **Get started** → pick a role.

## Scripts

```bash
npm run dev          # Dev server (port 3000)
npm run build        # tsc + production build
npm run type-check   # TypeScript only
npm run lint         # ESLint
```

## Dashboard Features

### Supplier (`/supplier`)
- Create invoice (buyer address, USDC amount, discount %, due date)
- Stats: pending / funded / repaid counts
- Invoice table with status badges

### Investor (`/investor`)
- List pending invoices (amount, discount, yield, credit score)
- Fund invoice by ID + amount

### Buyer (`/buyer`)
- List invoices where wallet is buyer (preview uses demo buyer)
- Repay invoice by ID + amount
- Days-until-maturity highlighting

## Styling

- White + Stellar blue theme (cream background `#F9F7F2`, accent `#2B7CB8`)
- Tailwind CSS + CSS variables in `index.css`
- Fonts: Montserrat, Playfair Display, Space Grotesk (loaded in `index.html`)

## Contract Integration

Hooks in `useInvoices.ts` call:

- `create_invoice`, `fund_invoice`, `repay_invoice`
- `get_invoice`, `get_supplier_invoices`, `get_all` (pending/buyer lists)
- `get_credit_score`, `mark_overdue`

See `README.md` for contract build/deploy and initialization (`init` with USDC address).

## Related Docs

- `README.md` — full repo setup, contract, verification
- `LOCALHOST.md` — localhost troubleshooting
- `HARDENING_NOTES.md` — security hardening notes
