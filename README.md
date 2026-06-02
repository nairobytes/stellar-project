# InvoiceFi

> On-chain invoice financing for SMEs — built on Stellar using Soroban smart contracts in Rust.

InvoiceFi eliminates the middleman from invoice financing. Suppliers get early USDC liquidity today. Investors fund invoices at a discount and earn yield at maturity. Corporate buyers repay on-chain. All escrow logic, fund distribution, and credit scoring is enforced entirely by a Soroban smart contract — no banks, no delays, no fraud.

---

## Live Deployment

| | |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6` |
| **USDC Token (SAC)** | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| **USDC Issuer** | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| **Explorer** | [View on Stellar Expert ↗](https://stellar.expert/explorer/testnet/contract/CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6) |

---

## How It Works

```
Supplier creates invoice
        ↓
Investor funds it → USDC locked in contract escrow
        ↓
Buyer repays at maturity
        ↓
Contract automatically splits:
  → Principal + yield  →  Investor
  → Any surplus        →  Supplier
  → Credit score       →  Updated on-chain
```

Every step is a Soroban function. No human touches the funds.

---

## Invoice Lifecycle

```
Pending → Funded → Repaid
            ↓
          Overdue → Defaulted
```

| Status | Meaning |
|--------|---------|
| `Pending` | Created, waiting for an investor |
| `Funded` | Investor locked USDC in escrow |
| `Repaid` | Buyer paid — funds distributed automatically |
| `Overdue` | Maturity passed, not yet repaid |
| `Defaulted` | Marked after grace period — credit score penalised |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Rust + Soroban SDK v21 |
| Blockchain | Stellar Network |
| Token standard | Stellar Asset Contract (SAC) — USDC |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Wallet | Freighter API |
| Dev tooling | Stellar CLI + cargo |

---

## Repository Structure

```
stellar-project/
│
├── contract/                        # Soroban smart contract — live on Stellar Testnet
│   ├── src/
│   │   ├── lib.rs                   # Contract logic: functions, structs, storage, events
│   │   └── tests.rs                 # 18 unit tests covering full lifecycle
│   ├── test_snapshots/              # Soroban test snapshot files
│   ├── Cargo.toml                   # Package manifest and dependencies
│   ├── Makefile                     # Build shortcuts
│   └── README.md                    # Full contract API docs and CLI reference
│
├── frontend/                        # React + TypeScript frontend
│   ├── src/
│   │   ├── components/              # UI: dashboards, forms, layout, header, footer
│   │   ├── pages/                   # Routes: Home, GetStarted, Supplier, Investor, Buyer
│   │   ├── hooks/                   # useWallet.tsx, useInvoices.ts
│   │   ├── utils/                   # Soroban RPC, Stellar/Freighter, formatting helpers
│   │   ├── types/                   # Shared TypeScript types
│   │   ├── config.ts                # Contract addresses, network config, PREVIEW_MODE
│   │   └── App.tsx                  # React Router definitions
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/
│   ├── FRONTEND_README.md           # Component map, routes, preview mode guide
│   ├── LOCALHOST.md                 # Localhost setup and troubleshooting
│   └── HARDENING_NOTES.md          # Security hardening decisions
│
├── .gitignore
└── README.md
```

---

## Smart Contract

The contract is the core of InvoiceFi. It is written in Rust using `soroban-sdk` v21, deployed to Stellar Testnet, and handles all business logic on-chain.

### Contract Functions

| Function | Caller | Description |
|----------|--------|-------------|
| `init(usdc_contract)` | Admin | Initialise contract with USDC address — called once |
| `create_invoice(supplier, buyer, amount, discount_bps, maturity_time)` | Supplier | List an invoice for financing |
| `fund_invoice(invoice_id, investor, usdc_contract, amount)` | Investor | Lock USDC in escrow |
| `repay_invoice(invoice_id, buyer, usdc_contract, amount)` | Buyer | Repay — contract distributes funds |
| `mark_overdue(invoice_id)` | Anyone | Call after maturity timestamp passes |
| `mark_defaulted(invoice_id)` | Anyone | Mark overdue invoice as defaulted |
| `get_invoice(invoice_id)` | Read | Returns full invoice struct |
| `get_supplier_invoices(supplier)` | Read | Returns all invoice IDs for a supplier |
| `get_credit_score(supplier)` | Read | Returns supplier credit score (0–1000) |
| `get_configured_usdc_contract()` | Read | Returns configured USDC contract address |

### Credit Scoring

Every supplier starts at **500**. Score is updated automatically on-chain:

| Event | Change |
|-------|--------|
| Successful repayment | +20 (cap 1000) |
| Invoice defaulted | −40 (floor 0) |

### Events

Every state change emits a Soroban event — the frontend listens via Horizon streaming for real-time updates.

| Event | Trigger |
|-------|---------|
| `InvoiceCr` | `create_invoice` |
| `InvoiceFn` | `fund_invoice` |
| `InvoiceRp` | `repay_invoice` |
| `InvoiceDf` | `mark_defaulted` |

---

## Contract — Quick Start

### Prerequisites

```bash
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt
```

### Build

```bash
cd contract
stellar contract build
```

Output: `contract/target/wasm32v1-none/release/invoicefi.wasm`

### Test

```bash
cd contract
cargo test -- --nocapture
```

18 tests. All must pass. Covers: create, fund, repay, overdue, default, wrong buyer rejection, credit scoring, and full lifecycle.

### Deploy to testnet

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/invoicefi.wasm \
  --source admin \
  --network testnet
```

### Initialise

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source admin \
  --network testnet \
  -- init \
  --usdc_contract $USDC_TOKEN
```

For full CLI invocation examples for every function, see [`contract/README.md`](./contract/README.md).

---

## Frontend — Quick Start

The frontend runs in **Preview Mode** by default. All three dashboards work with sample data — no wallet or contract connection needed.

### Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`

### Connect to live contract

Set `PREVIEW_MODE = false` in `frontend/src/config.ts`, then fill in `.env`:

```env
VITE_CONTRACT_ADDRESS=CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6
VITE_USDC_ADDRESS=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### Routes

| Path | Page |
|------|------|
| `/` | Landing page — hero, features, FAQ |
| `/get-started` | Role picker — supplier, investor, or buyer |
| `/supplier` | Create invoices, track pipeline, view credit score |
| `/investor` | Browse pending invoices, fund, track yield |
| `/buyer` | View obligations, repay invoices |

### Scripts

```bash
npm run dev          # Dev server on port 3000
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run type-check   # TypeScript only, no emit
npm run preview      # Preview production build
```

---

## Test Accounts (Testnet)

| Role | Public Key |
|------|-----------|
| Admin | `GCGPX3QLQ5RTQDPP4UEYFGZ2IG5E3WZ5TL3BHYJMQS7M652ZXF7GILJ4` |
| Supplier | `GCQJPTW7IKNDOFDL3G4AV232Y2UVZVKZH52EIM7EHKA3FWJXCE4P5RY7` |
| Investor | `GBEQWIDBKTSPG2C7OACPTNLGMWFOKQM5CO2MJ22GOKHKHTNP42N6ZJOW` |
| Buyer | `GAXVRKUKYLOUGCTGMKRDDXWAFIYXJJKRH7W7DDE6VP42X4JDLFZZNZF2` |

---

## Verification Checklist

Run all three before any demo or release:

```bash
cd contract && cargo test -- --nocapture   # 18 tests must pass
cd frontend && npm run lint                # 0 warnings
cd frontend && npm run build               # must succeed
```

---

## Security Notes

- All USDC token transfers use the Stellar Asset Contract (SAC) interface via `token::Client` — the contract never holds private keys
- `init()` pins the USDC contract address at deployment — `fund_invoice` and `repay_invoice` reject any token contract that does not match, preventing caller-controlled token substitution
- All auth enforced using `require_auth()` — suppliers, investors, and buyers must sign their own transactions
- Frontend session state is in-memory only — no invoice state persisted in `localStorage`

---

## Additional Docs

| File | Contents |
|------|---------|
| [`contract/README.md`](./contract/README.md) | Full contract API, data structures, CLI examples, events |
| [`docs/FRONTEND_README.md`](./docs/FRONTEND_README.md) | Component map, routes, preview mode |
| [`docs/LOCALHOST.md`](./docs/LOCALHOST.md) | Localhost setup and troubleshooting |
| [`docs/HARDENING_NOTES.md`](./docs/HARDENING_NOTES.md) | Security hardening decisions |

---

## Built at Stellar Bootcamp 2026 Nairobi, Kenya