# Localhost Guide

This guide helps you run InvoiceFi locally from a clean shell.

## Prerequisites

- Node.js 18+
- npm
- Optional for contract work: Rust + cargo

Check tools:

```bash
node -v
npm -v
cargo -V
```

If cargo is missing in a fresh shell:

```bash
source "$HOME/.cargo/env"
```

## 1) Install dependencies

```bash
npm install
```

## 2) Configure env

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
VITE_CONTRACT_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ID>
VITE_USDC_ADDRESS=<YOUR_USDC_CONTRACT_ID>
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

## 3) Run frontend locally

```bash
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:3000`.

## 4) Verify production build

```bash
npm run build
```

## 5) Optional: run contract tests

```bash
cargo test -- --nocapture
```

## Troubleshooting

### Frontend fails to start

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev -- --host 0.0.0.0
```

### Port 3000 busy

```bash
lsof -i :3000
kill <PID>
```

### Freighter button not working

- Install Freighter extension.
- Switch account/network to testnet.
- Reload the page.

### Contract values not showing expected data

- Ensure `VITE_CONTRACT_ADDRESS` and `VITE_USDC_ADDRESS` are valid testnet IDs.
- Restart Vite after `.env` changes.
