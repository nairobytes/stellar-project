# Testnet USDC for InvoiceFi

InvoiceFi does **not** use XLM for invoice amounts. XLM is only for transaction fees on Stellar Testnet.

Funding and repayment use the **Soroban USDC token contract** configured in `frontend/.env`:

| | |
|---|---|
| USDC contract (SAC) | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| Classic issuer (reference) | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

The sidebar **USDC balance** is read from this SAC contract, not from a classic USDC trustline on Horizon.

## Frontend developers (you did not deploy the contract)

You cannot turn XLM into InvoiceFi USDC from the app alone. Ask the **backend / contract deployer** to:

1. Mint test USDC to your investor `G…` address (from the app sidebar).
2. Use at least the **funded amount** for the invoice (e.g. $95 for a $100 invoice at 5% discount).

Share with them:

- Your public key
- USDC SAC contract: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`
- InvoiceFi contract: `CDR4RQN6TVPHHEKD46MKH6LH677XLWHLN63LYICDHLR5PKHDP74KFRF6`

For local UI work without funding, set `PREVIEW_MODE = true` in `frontend/src/config.ts` — dashboards use sample data and skip wallet USDC.

## If you have XLM but $0 USDC

1. Connect your **investor** wallet in the app and copy the `G…` address from the sidebar.
2. **Mint** test USDC to that address using the Stellar CLI and the key that administers the token (whoever deployed the USDC SAC).

```bash
# 100 USDC = 1_000_000_000 stroops (7 decimals)
stellar contract invoke \
  --id CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
  --source-account <admin-key-alias> \
  --network testnet \
  --send yes \
  -- mint \
  --to <INVESTOR_G_ADDRESS> \
  --amount 1000000000
```

For a single invoice at 5% discount on $100 face value, mint at least **$95** (`950000000` stroops).

3. Refresh the investor page — balance should update — then **Fund invoice**.

## List your CLI keys

```bash
stellar keys ls
```

Use the alias that matches your deploy **admin** / token admin account.

## Quick demo without minting

The README lists a sample **investor** public key (`GBEQWIDBKTSPG2C7OACPTNLGMWFOKQM5CO2MJ22GOKHKHTNP42N6ZJOW`). It only works if that account was minted USDC on **this** token contract. Otherwise mint to your own Freighter testnet account as above.

## Buyer repay

The **buyer** wallet also needs SAC USDC (full face value, e.g. $100) before repaying a funded invoice.

## Public Circle testnet USDC

Circle’s faucet USDC is a **different** asset. It will not show in InvoiceFi unless it is the same SAC contract in `.env`. For this project, use **mint** on the deployed SAC.
