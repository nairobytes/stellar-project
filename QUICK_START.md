# Quick Start Guide - InvoiceFi Frontend

## What's Been Created

A complete React/TypeScript frontend for InvoiceFi has been created in your existing Stellar project. The app integrates with your Soroban invoice financing contract and provides three main dashboards:

### 📁 Project Structure
```
src/
├── components/           # React components
│   ├── Header.tsx       # Navigation & wallet info
│   ├── DashboardTabs.tsx    # Tab navigation
│   ├── SupplierDashboard.tsx
│   ├── InvestorDashboard.tsx
│   ├── BuyerDashboard.tsx
│   ├── CreateInvoiceForm.tsx
│   ├── FundInvoiceForm.tsx
│   ├── RepayInvoiceForm.tsx
│   └── InvoiceTable.tsx
├── hooks/               # Custom React hooks
│   ├── useWallet.ts    # Freighter wallet integration
│   └── useInvoices.ts  # Data fetching with React Query
├── utils/              # Helper functions
│   ├── soroban.ts      # Contract interactions
│   ├── stellar.ts      # Wallet & Freighter utilities
│   └── format.ts       # Formatting & conversion
├── types/              # TypeScript definitions
├── config.ts           # Configuration & constants
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Contract Address
Edit `src/config.ts` and update:
```typescript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'
export const USDC_ADDRESS = 'YOUR_TESTNET_USDC_ADDRESS'
```

### 3. Start Development Server
```bash
npm run dev
```

The app will automatically open at `http://localhost:3000`

### 4. Connect Your Wallet
- Click "Connect Wallet" in the top right
- Approve the connection in Freighter
- Your USDC balance will be displayed in the header

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Check TypeScript types
npm run lint         # Run ESLint
```

## Features Overview

### 👷 Supplier Dashboard
- **Create Invoice**: Fill form with buyer address, amount, discount rate, due date
- **Invoice Management**: View all your invoices with status tracking
- **Stats**: See pending, funded, and repaid invoice counts

### 💰 Investor Dashboard
- **Browse Invoices**: See all pending invoices available for funding
- **Funding Options**: Fund any pending invoice to earn 5% yield
- **Credit Scores**: View supplier credit scores to assess risk
- **Expected Returns**: See exact yield amounts for each invoice

### 🛒 Buyer Dashboard
- **View Obligations**: See all invoices where you're the buyer
- **Payment Tracking**: Monitor days until maturity and payment status
- **Repayment**: Repay invoices with one click
- **Account Summary**: Total amount owed and paid

## Key Features

✅ **Freighter Wallet Integration** - Secure, non-custodial wallet connection
✅ **Soroban Contract Interaction** - Call contract functions directly from the UI
✅ **USDC Balance Display** - Real-time balance in wallet header
✅ **React Query** - Efficient data fetching and caching
✅ **Form Validation** - React Hook Form with Zod schemas
✅ **Loading States** - Spinners and feedback during transactions
✅ **Error Handling** - Toast notifications for errors and success
✅ **Responsive Design** - Mobile-friendly Tailwind CSS styling
✅ **TypeScript** - Full type safety throughout

## Configuration

### Network Details
```typescript
Network: Stellar Testnet
RPC URL: https://soroban-testnet.stellar.org
Horizon URL: https://horizon-testnet.stellar.org
Network Passphrase: Test SDF Network ; September 2015
```

### Amount Conversions
- **Stroops**: 1 USDC = 10,000,000 stroops
- **Basis Points**: 1 bp = 0.01% (500 bp = 5%)
- **Investor Yield**: 5% (500 basis points) on principal

## Next Steps

### To Get Started Immediately:
1. Install dependencies: `npm install`
2. Update contract address in `src/config.ts`
3. Run `npm run dev`
4. Install Freighter browser extension
5. Connect your Testnet wallet

### To Implement Full Functionality:
1. Replace mock data in `src/hooks/useInvoices.ts` with actual contract calls
2. Implement real USDC balance fetching in `src/utils/stellar.ts`
3. Add transaction signing with Freighter for contract invocations
4. Test all three dashboard flows with Testnet accounts

### Files That Need Updates for Production:
- `src/config.ts` - Add your contract address and USDC token address
- `src/hooks/useInvoices.ts` - Replace mock data with contract calls
- `src/utils/stellar.ts` - Implement real balance fetching
- `src/utils/soroban.ts` - Complete Soroban contract interaction implementation

## Common Issues

**"Wallet not connected"**
- Install Freighter browser extension
- Click "Connect Wallet" button
- Approve in Freighter popup

**"Contract address not found"**
- Update `src/config.ts` with your deployed contract address
- Ensure contract is deployed to Testnet

**"USDC balance not showing"**
- Check Testnet USDC token address in config
- Ensure wallet has been funded with Testnet USDC

## Development Tips

1. Use React DevTools to inspect component state
2. Use Redux DevTools browser extension to debug React Query
3. Check browser console for detailed error messages
4. Use Freighter's transaction inspector to verify contract calls
5. Test with different wallet addresses for different roles

## Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Freighter API](https://github.com/stellar/freighter)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)

## Support

For issues with the frontend, check:
1. Browser console for errors
2. Freighter wallet status
3. Network connectivity to Testnet RPC
4. Contract address configuration
5. USDC token address configuration

Have questions? Refer to FRONTEND_README.md for detailed documentation.
