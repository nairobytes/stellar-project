# Hardening Notes

This file documents the reliability and security hardening implemented in the current codebase.

## Implemented

### 1) Contract token-address pinning

File: src/lib.rs

- `init` now requires `usdc_contract`.
- Contract stores configured USDC contract in instance storage.
- `fund_invoice` and `repay_invoice` reject any token contract that does not match configured USDC.
- Added `get_configured_usdc_contract` helper for observability.

Why this matters:
- Prevents caller from passing an arbitrary token contract to bypass economic assumptions.

### 2) Frontend local storage reduction

Files:
- src/utils/soroban.ts
- src/utils/stellar.ts

Changes:
- Invoice state no longer persisted in localStorage.
- Session in-memory state is now used by the local facade.
- Wallet balance mock cache moved from localStorage to in-memory map.

Why this matters:
- Reduces persistent browser tampering and sensitive local data leakage.

### 3) Wallet network validation and better error messaging

File: src/utils/stellar.ts

Changes:
- Validate Freighter network passphrase against configured network.
- Surface explicit error for wrong network.
- Better handling for access rejection/user denial.

### 4) Frontend QA reliability

Files:
- .eslintrc.json
- src/components/InvestorDashboard.tsx
- src/hooks/useWallet.ts

Changes:
- Fixed invalid ESLint JSON config.
- Fixed conditional hook ordering issue.
- Added missing callback dependency.

## Verification

Commands run:

```bash
cargo test -- --nocapture
npm run lint
npm run build
```

Results at time of update:
- Rust tests: 18 passed, 0 failed.
- Lint: pass.
- Build: pass.

## Remaining Production Gaps

- Replace local in-memory invoice facade with real on-chain read/write pipeline.
- Implement robust RPC/Horizon timeout/retry handling on real network paths.
- Add explicit storage TTL extension policy for long-lived invoice records.
- Add role policy for overdue/default transitions if public keeper model is not desired.
- Add platform fee and advanced financial policy flows in settlement logic.
