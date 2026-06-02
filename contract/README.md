# InvoiceFi

On-chain invoice financing platform built on Stellar using Soroban smart contracts written in Rust.

---

## Overview

InvoiceFi allows suppliers to list unpaid invoices for financing. Investors fund those invoices at a discount and receive the full face value when the corporate buyer repays. All escrow logic, fund distribution, and credit scoring is handled entirely by the smart contract — no intermediaries.

---

## Deployment

| Property | Value |
|----------|-------|
| Network | Stellar Testnet |
| Contract ID | `CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6` |
| USDC Token (SAC) | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| USDC Issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| Explorer | https://stellar.expert/explorer/testnet/contract/CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6 |

---

## Test Accounts (Testnet)

| Role | Public Key |
|------|-----------|
| Admin | `GCGPX3QLQ5RTQDPP4UEYFGZ2IG5E3WZ5TL3BHYJMQS7M652ZXF7GILJ4` |
| Supplier | `GCQJPTW7IKNDOFDL3G4AV232Y2UVZVKZH52EIM7EHKA3FWJXCE4P5RY7` |
| Investor | `GBEQWIDBKTSPG2C7OACPTNLGMWFOKQM5CO2MJ22GOKHKHTNP42N6ZJOW` |
| Buyer | `GAXVRKUKYLOUGCTGMKRDDXWAFIYXJJKRH7W7DDE6VP42X4JDLFZZNZF2` |

---

## Project Structure

```
contract/
  src/
    lib.rs        # Contract logic — all functions, structs, storage
    tests.rs      # Unit tests — 7 tests covering full lifecycle
  Cargo.toml      # Package manifest and dependencies
  Makefile        # Build shortcuts
```

---

## Data Structures

### InvoiceStatus

```rust
pub enum InvoiceStatus {
    Pending,      // Created, waiting for investor
    Funded,       // Investor paid, supplier received advance
    Repaid,       // Buyer paid, investor received return
    Overdue,      // Maturity passed, not yet repaid
    Defaulted,    // Grace period passed, admin marked default
}
```

### Invoice

```rust
pub struct Invoice {
    pub id: u64,
    pub supplier: Address,
    pub buyer: Address,
    pub amount: i128,           // Face value in USDC stroops
    pub discount_bps: u32,      // Discount in basis points (500 = 5%)
    pub funded_amount: i128,    // Amount investor pays (amount - discount)
    pub status: InvoiceStatus,
    pub maturity_time: u64,     // Unix timestamp for repayment deadline
    pub investor: Option<Address>,
    pub created_at: u64,
    pub repaid_at: u64,
}
```

### CreditScore

```rust
pub struct CreditScore {
    pub score: u32,             // 0 to 1000, starts at 500
    pub total_invoices: u32,
    pub repaid_count: u32,
    pub defaulted_count: u32,
}
```

---

## Contract Functions

### initialize

```
initialize(env, admin)
```

Sets the platform admin. Called once after deployment. Panics if called again.

---

### create_invoice

```
create_invoice(env, supplier, buyer, amount, discount_bps, maturity_time) -> u64
```

Called by a supplier to list an invoice for financing.

- Supplier must sign the transaction
- Amount must be positive
- Discount must be between 1 and 9999 basis points
- Maturity time must be in the future
- Returns the new invoice ID
- Emits `INV_CREAT` event

Example:

```bash
stellar contract invoke --id $CONTRACT_ID --source supplier --network testnet -- create_invoice \
  --supplier $(stellar keys address supplier) \
  --buyer $(stellar keys address buyer) \
  --amount 10000000 \
  --discount_bps 500 \
  --maturity_time 1800000000
```

---

### fund_invoice

```
fund_invoice(env, investor, invoice_id, usdc_token)
```

Called by an investor to finance a pending invoice.

- Invoice must be in Pending status
- Invoice must not have passed maturity
- Transfers `funded_amount` USDC from investor to contract
- Immediately forwards `funded_amount` to supplier
- Records investor address on invoice
- Emits `INV_FUND` event

Example:

```bash
stellar contract invoke --id $CONTRACT_ID --source investor --network testnet -- fund_invoice \
  --investor $(stellar keys address investor) \
  --invoice_id 2 \
  --usdc_token $USDC_TOKEN
```

---

### repay_invoice

```
repay_invoice(env, buyer, invoice_id, usdc_token)
```

Called by the corporate buyer to repay the invoice.

- Caller must be the buyer recorded on the invoice
- Invoice must be in Funded or Overdue status
- Buyer transfers full face value (`amount`) to contract
- Contract forwards full face value to investor
- Investor yield = `amount - funded_amount`
- Updates supplier credit score (+50 points)
- Emits `INV_REPAY` event

Example:

```bash
stellar contract invoke --id $CONTRACT_ID --source buyer --network testnet -- repay_invoice \
  --buyer $(stellar keys address buyer) \
  --invoice_id 2 \
  --usdc_token $USDC_TOKEN
```

---

### mark_overdue

```
mark_overdue(env, invoice_id)
```

Can be called by anyone once the maturity timestamp has passed.

- Invoice must be in Funded status
- Current time must be past `maturity_time`
- Updates status to Overdue
- Emits `INV_OVER` event

Example:

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- mark_overdue \
  --invoice_id 1
```

---

### mark_defaulted

```
mark_defaulted(env, invoice_id)
```

Admin only. Called after grace period with no repayment.

- Invoice must be in Overdue status
- Reduces supplier credit score by 100 points
- Emits `INV_DEF` event

Example:

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- mark_defaulted \
  --invoice_id 1
```

---

### get_invoice

```
get_invoice(env, invoice_id) -> Invoice
```

Returns the full invoice struct for a given ID. Read-only, no transaction needed.

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- get_invoice \
  --invoice_id 2
```

---

### get_supplier_invoices

```
get_supplier_invoices(env, supplier) -> Vec<u64>
```

Returns all invoice IDs created by a given supplier address.

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- get_supplier_invoices \
  --supplier $(stellar keys address supplier)
```

---

### get_credit_score

```
get_credit_score(env, supplier) -> CreditScore
```

Returns the supplier's on-chain credit score. Defaults to 500 if no history.

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- get_credit_score \
  --supplier $(stellar keys address supplier)
```

---

### get_invoice_count

```
get_invoice_count(env) -> u64
```

Returns the total number of invoices created on the platform.

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- get_invoice_count
```

---

## Events

Every state change emits a Soroban event. The frontend can listen via Horizon streaming.

| Event | Symbol | Trigger |
|-------|--------|---------|
| Invoice created | `INV_CREAT` | create_invoice |
| Invoice funded | `INV_FUND` | fund_invoice |
| Invoice repaid | `INV_REPAY` | repay_invoice |
| Invoice overdue | `INV_OVER` | mark_overdue |
| Invoice defaulted | `INV_DEF` | mark_defaulted |

---

## Credit Scoring

Every supplier starts with a score of 500.

| Event | Score Change |
|-------|-------------|
| Successful repayment | +50 (max 1000) |
| Default | -100 (min 0) |

The score is stored on-chain in Soroban persistent storage and is publicly readable.

---

## Unit Tests

7 tests covering the full contract lifecycle. Run with:

```bash
cargo test
```

| Test | What it covers |
|------|---------------|
| `test_create_invoice` | Invoice created with correct fields |
| `test_cannot_fund_already_funded_invoice` | Double funding rejected |
| `test_wrong_buyer_cannot_repay` | Wrong buyer rejected |
| `test_cannot_mark_overdue_before_maturity` | Early overdue rejected |
| `test_mark_overdue_after_maturity` | Overdue works after maturity |
| `test_credit_score_increases_on_repayment` | Score increases by 50 |
| `test_happy_path_full_lifecycle` | Full create, fund, repay flow |

---

## Build and Deploy

**Build:**

```bash
stellar contract build
```

Output: `target/wasm32-unknown-unknown/release/invoicefi.wasm`

**Deploy to testnet:**

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/invoicefi.wasm \
  --source admin \
  --network testnet
```

**Initialize:**

```bash
stellar contract invoke --id $CONTRACT_ID --source admin --network testnet -- initialize \
  --admin $(stellar keys address admin)
```

---

## Environment Variables

Add to your `.env` or shell profile:

```bash
export CONTRACT_ID=CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6
export USDC_TOKEN=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
export STELLAR_NETWORK=testnet
export HORIZON_URL=https://horizon-testnet.stellar.org
```

---

## Dependencies

```toml
[dependencies]
soroban-sdk = { version = "21.0.0" }

[dev-dependencies]
soroban-sdk = { version = "21.0.0", features = ["testutils"] }
```

---

## Notes

- All amounts are in USDC stroops. 1 USDC = 10,000,000 stroops (7 decimal places on Stellar).
- The contract uses Soroban persistent storage for invoices and credit scores.
- The contract uses Soroban instance storage for the admin address and invoice counter.
- Token transfers use the Stellar Asset Contract (SAC) interface via `token::Client`.
- All auth is enforced using `require_auth()` — the contract never holds private keys.