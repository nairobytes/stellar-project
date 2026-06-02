# InvoiceFi

InvoiceFi is a Stellar Soroban invoice-financing platform for SMEs.

The app supports three roles:
- Supplier: creates invoices and gets early liquidity.
- Investor: funds invoices and earns yield.
- Buyer: repays funded invoices at maturity.

## Tech Stack

- Smart contract: Rust + Soroban SDK
- Frontend: React + TypeScript + Vite + Tailwind
- Wallet integration: Freighter API
- Network defaults: Stellar testnet + USDC-compatible token contract

## Frontend Routes

| Path | Page |
|------|------|
| `/` | Landing (hero, features, FAQ) |
| `/get-started` | Role picker (supplier / investor / buyer) |
| `/supplier` | Supplier dashboard |
| `/investor` | Investor marketplace |
| `/buyer` | Buyer payment portal |

## Preview Mode

`src/config.ts` sets `PREVIEW_MODE = true` by default so you can browse all dashboards with sample data and without connecting Freighter. Set it to `false` when wallet + on-chain calls are ready.

## Repository Structure

```text
.
├── src/
│   ├── pages/             # Route-level pages (Home, GetStarted, dashboards)
│   ├── components/        # UI (Header, Hero, dashboards, forms)
│   ├── hooks/             # useWallet.tsx, useInvoices.ts
│   ├── utils/             # Soroban + Stellar utilities
│   ├── types/             # Shared TS types
│   ├── lib.rs             # Soroban contract
│   ├── config.ts          # Env config + PREVIEW_MODE
│   └── App.tsx            # React Router routes
├── Cargo.toml             # Soroban contract crate config
├── package.json           # Frontend scripts + deps
├── .env.example           # Frontend environment template
└── vite.config.ts         # Dev server config (port 3000)
```

## Quick Start (Localhost)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Then edit `.env` and set at minimum:
- `VITE_CONTRACT_ADDRESS`
- `VITE_USDC_ADDRESS`

If you do not have deployed addresses yet, the app still starts with placeholders from `src/config.ts`.

### 3) Start the frontend on localhost

```bash
npm run dev -- --host 0.0.0.0
```

Open:
- `http://localhost:3000`

If `3000` is already in use, Vite will auto-select `3001`.

### 4) Build check

```bash
npm run build
```

## Frontend Scripts

```bash
npm run dev         # Start Vite dev server
npm run build       # TypeScript check + production build
npm run preview     # Preview production build
npm run type-check  # Run tsc with no emit
npm run lint        # Run ESLint
```

## Smart Contract (Rust/Soroban)

### Prerequisites

```bash
rustup target add wasm32-unknown-unknown
```

Build contract WASM:

```bash
cargo build --target wasm32-unknown-unknown --release
```

Run tests:

```bash
cargo test -- --nocapture
```

## Full Setup (Contract + Frontend)

Use this sequence for a clean, end-to-end local setup.

1. Install dependencies

```bash
npm install
```

2. Prepare frontend environment

```bash
cp .env.example .env
```

3. Run contract tests

```bash
cargo test -- --nocapture
```

4. Run frontend quality gates

```bash
npm run lint
npm run build
```

5. Start localhost app

```bash
npm run dev -- --host 0.0.0.0
```

## Contract Initialization Requirement

The contract now enforces a configured USDC contract address at initialization.

- `init(env, usdc_contract)` must be called once.
- `fund_invoice` and `repay_invoice` now validate the provided token contract against the configured USDC contract.

Security benefit:
- Prevents caller-controlled token contract substitution in financing and repayment paths.

## Current Frontend State Model

The frontend invoice facade no longer persists invoice state in browser localStorage.

- Session state is in-memory only.
- This reduces persistent tampering and local data leakage risks.
- For production, replace the local facade with direct on-chain reads/writes and signed transactions.

## Verification Checklist

Run these before demos or releases:

```bash
cargo test -- --nocapture
npm run lint
npm run build
```

Expected:
- Contract tests pass.
- Lint passes.
- Build passes.

If `cargo` is not found in a new shell, run:

```bash
source "$HOME/.cargo/env"
```

## Environment Variables

Reference `.env.example`:

- `VITE_CONTRACT_ADDRESS`: InvoiceFi Soroban contract ID
- `VITE_USDC_ADDRESS`: USDC token contract ID
- `VITE_SOROBAN_RPC_URL`: Soroban RPC URL
- `VITE_HORIZON_URL`: Horizon URL
- `VITE_NETWORK_PASSPHRASE`: Stellar network passphrase
- `VITE_API_URL`: optional backend API URL

## Common Localhost Issues

### Port already in use

```bash
lsof -i :3000
kill <PID>
```

### Freighter not detected
- Install Freighter browser extension.
- Reload the app after installation.
- Use a testnet account in Freighter.

### Wrong contract/network
- Verify `.env` values.
- Confirm passphrase matches testnet: `Test SDF Network ; September 2015`.

### Freighter wrong network selected
- Switch Freighter to Stellar testnet.
- Retry wallet connect.
- The app now surfaces a specific network mismatch message.

### Contract not initialized
- Ensure contract `init` was called with the intended USDC contract.
- `fund_invoice`/`repay_invoice` will fail until initialized.

## Additional Docs

- `FRONTEND_README.md`: frontend features, routes, and component map
- `LOCALHOST.md`: command-focused localhost runbook
- `HARDENING_NOTES.md`: contract and frontend hardening notes