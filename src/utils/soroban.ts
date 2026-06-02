import { BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS } from '../config';
import { Invoice, InvoiceStatus } from '../types';

interface PersistedInvoice {
  id: number;
  supplier: string;
  buyer: string;
  amount: string;
  discount_bps: number;
  funded_amount: string;
  status: InvoiceStatus;
  maturity_time: string;
  investor: string | null;
  creation_time: string;
  repaid_amount: string;
}

interface ChainState {
  nextId: number;
  invoices: PersistedInvoice[];
  creditScores: Record<string, number>;
}

let chainState: ChainState = emptyState();

function now(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

function emptyState(): ChainState {
  return {
    nextId: 1,
    invoices: [],
    creditScores: {},
  };
}

function loadState(): ChainState {
  return chainState;
}

function saveState(state: ChainState): void {
  chainState = state;
}

function toInvoice(input: PersistedInvoice): Invoice {
  return {
    id: BigInt(input.id),
    supplier: input.supplier,
    buyer: input.buyer,
    amount: BigInt(input.amount),
    discount_bps: input.discount_bps,
    funded_amount: BigInt(input.funded_amount),
    status: input.status,
    maturity_time: BigInt(input.maturity_time),
    investor: input.investor,
    creation_time: BigInt(input.creation_time),
    repaid_amount: BigInt(input.repaid_amount),
  };
}

function fromInvoice(input: Invoice): PersistedInvoice {
  return {
    id: Number(input.id),
    supplier: input.supplier,
    buyer: input.buyer,
    amount: input.amount.toString(),
    discount_bps: input.discount_bps,
    funded_amount: input.funded_amount.toString(),
    status: input.status,
    maturity_time: input.maturity_time.toString(),
    investor: input.investor,
    creation_time: input.creation_time.toString(),
    repaid_amount: input.repaid_amount.toString(),
  };
}

function requireAddress(value: string, label: string): void {
  if (!/^(C|G)[A-Z0-9]{55}$/.test(value)) {
    throw new Error(`${label} is not a valid Stellar address`);
  }
}

export async function createInvoice(
  supplier: string,
  buyer: string,
  amount: bigint,
  discount_bps: number,
  maturity_time: bigint
): Promise<bigint> {
  requireAddress(supplier, 'Supplier address');
  requireAddress(buyer, 'Buyer address');

  if (amount <= 0n) throw new Error('Invoice amount must be greater than zero');
  if (discount_bps < 0 || discount_bps > BASIS_POINTS_DIVISOR) {
    throw new Error('Discount rate must be between 0 and 100%');
  }
  if (maturity_time <= now()) {
    throw new Error('Due date must be in the future');
  }

  const state = loadState();
  const id = state.nextId;
  state.nextId += 1;

  const invoice: Invoice = {
    id: BigInt(id),
    supplier,
    buyer,
    amount,
    discount_bps,
    funded_amount: 0n,
    status: 'Pending',
    maturity_time,
    investor: null,
    creation_time: now(),
    repaid_amount: 0n,
  };

  state.invoices.push(fromInvoice(invoice));
  saveState(state);

  return BigInt(id);
}

export async function fundInvoice(
  invoice_id: bigint,
  investor: string,
  _usdc_contract: string,
  amount: bigint
): Promise<boolean> {
  requireAddress(investor, 'Investor address');
  if (amount <= 0n) throw new Error('Funding amount must be positive');

  const state = loadState();
  const idx = state.invoices.findIndex((inv) => inv.id === Number(invoice_id));
  if (idx < 0) throw new Error('Invoice not found');

  const invoice = toInvoice(state.invoices[idx]);
  if (invoice.status !== 'Pending') {
    throw new Error('Invoice must be pending before funding');
  }

  invoice.funded_amount = invoice.funded_amount + amount;
  if (invoice.funded_amount >= invoice.amount) {
    invoice.status = 'Funded';
    invoice.investor = investor;
  }

  state.invoices[idx] = fromInvoice(invoice);
  saveState(state);
  return true;
}

export async function repayInvoice(
  invoice_id: bigint,
  buyer: string,
  _usdc_contract: string,
  repayment_amount: bigint
): Promise<boolean> {
  requireAddress(buyer, 'Buyer address');
  if (repayment_amount <= 0n) throw new Error('Repayment amount must be positive');

  const state = loadState();
  const idx = state.invoices.findIndex((inv) => inv.id === Number(invoice_id));
  if (idx < 0) throw new Error('Invoice not found');

  const invoice = toInvoice(state.invoices[idx]);
  if (invoice.buyer !== buyer) {
    throw new Error('Only the invoice buyer can repay this invoice');
  }

  if (invoice.status !== 'Funded' && invoice.status !== 'Overdue') {
    throw new Error('Invoice must be funded or overdue before repayment');
  }

  const yieldAmount =
    (invoice.amount * BigInt(INVESTOR_YIELD_BPS)) / BigInt(BASIS_POINTS_DIVISOR);
  const totalDue = invoice.amount + yieldAmount;

  if (repayment_amount < totalDue) {
    throw new Error('Repayment amount is less than amount due');
  }

  invoice.repaid_amount = repayment_amount;
  invoice.status = 'Repaid';

  const currentScore = state.creditScores[invoice.supplier] ?? 500;
  state.creditScores[invoice.supplier] = Math.min(currentScore + 20, 1000);

  state.invoices[idx] = fromInvoice(invoice);
  saveState(state);
  return true;
}

export async function getInvoice(invoice_id: bigint): Promise<Invoice> {
  const state = loadState();
  const invoice = state.invoices.find((inv) => inv.id === Number(invoice_id));
  if (!invoice) throw new Error('Invoice not found');
  return toInvoice(invoice);
}

export async function getSupplierInvoices(supplier: string): Promise<bigint[]> {
  const state = loadState();
  return state.invoices
    .filter((inv) => inv.supplier === supplier)
    .map((inv) => BigInt(inv.id));
}

export async function getCreditScore(supplier: string): Promise<number> {
  const state = loadState();
  return state.creditScores[supplier] ?? 500;
}

export async function markOverdue(invoice_id: bigint): Promise<boolean> {
  const state = loadState();
  const idx = state.invoices.findIndex((inv) => inv.id === Number(invoice_id));
  if (idx < 0) throw new Error('Invoice not found');

  const invoice = toInvoice(state.invoices[idx]);
  if (now() <= invoice.maturity_time) {
    throw new Error('Invoice has not reached maturity time');
  }

  if (invoice.status !== 'Funded') {
    return false;
  }

  invoice.status = 'Overdue';
  state.invoices[idx] = fromInvoice(invoice);
  saveState(state);
  return true;
}

export async function markDefaulted(invoice_id: bigint): Promise<boolean> {
  const state = loadState();
  const idx = state.invoices.findIndex((inv) => inv.id === Number(invoice_id));
  if (idx < 0) throw new Error('Invoice not found');

  const invoice = toInvoice(state.invoices[idx]);
  if (invoice.status !== 'Overdue') {
    throw new Error('Only overdue invoices can be marked defaulted');
  }

  invoice.status = 'Defaulted';
  const currentScore = state.creditScores[invoice.supplier] ?? 500;
  state.creditScores[invoice.supplier] = Math.max(currentScore - 40, 0);
  state.invoices[idx] = fromInvoice(invoice);
  saveState(state);
  return true;
}

export async function updateCreditScore(supplier: string, newScore: number): Promise<void> {
  if (newScore < 0 || newScore > 1000) {
    throw new Error('Credit score must be between 0 and 1000');
  }
  const state = loadState();
  state.creditScores[supplier] = newScore;
  saveState(state);
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const state = loadState();
  return state.invoices.map(toInvoice);
}
