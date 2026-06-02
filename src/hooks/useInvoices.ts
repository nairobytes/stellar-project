import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createInvoice,
  fundInvoice,
  getAllInvoices,
  getCreditScore,
  getInvoice,
  getSupplierInvoices,
  markOverdue,
  repayInvoice,
} from '../utils/soroban';
import { STROOPS_PER_UNIT, USDC_ADDRESS } from '../config';

function toStroops(amount: string): bigint {
  const parsed = Number.parseFloat(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0n;
  return BigInt(Math.floor(parsed * STROOPS_PER_UNIT));
}

function toTimestamp(date: string): bigint {
  return BigInt(Math.floor(new Date(date).getTime() / 1000));
}

async function autoMarkOverdue(invoiceId: bigint, maturityTime: bigint, status: string) {
  if (status !== 'Funded') return;
  if (BigInt(Math.floor(Date.now() / 1000)) <= maturityTime) return;

  try {
    await markOverdue(invoiceId);
  } catch {
    // Background sync only; the explicit UI action handles surfaced failures.
  }
}

export function useSupplierInvoices(supplierAddress: string | null) {
  return useQuery({
    queryKey: ['supplierInvoices', supplierAddress],
    queryFn: async () => {
      if (!supplierAddress) return [];
      const ids = await getSupplierInvoices(supplierAddress);
      const invoices = await Promise.all(ids.map((id) => getInvoice(id)));
      await Promise.all(
        invoices.map((invoice) => autoMarkOverdue(invoice.id, invoice.maturity_time, invoice.status))
      );
      const refreshedIds = await getSupplierInvoices(supplierAddress);
      return Promise.all(refreshedIds.map((id) => getInvoice(id)));
    },
    enabled: !!supplierAddress,
  });
}

export function usePendingInvoices() {
  return useQuery({
    queryKey: ['pendingInvoices'],
    queryFn: async () => {
      const invoices = await getAllInvoices();
      await Promise.all(
        invoices.map((invoice) => autoMarkOverdue(invoice.id, invoice.maturity_time, invoice.status))
      );
      const refreshed = await getAllInvoices();
      return refreshed.filter((invoice) => invoice.status === 'Pending');
    },
  });
}

export function useBuyerInvoices(buyerAddress: string | null) {
  return useQuery({
    queryKey: ['buyerInvoices', buyerAddress],
    queryFn: async () => {
      if (!buyerAddress) return [];
      const invoices = await getAllInvoices();
      const ownInvoices = invoices.filter((invoice) => invoice.buyer === buyerAddress);
      await Promise.all(
        ownInvoices.map((invoice) => autoMarkOverdue(invoice.id, invoice.maturity_time, invoice.status))
      );
      const refreshed = await getAllInvoices();
      return refreshed.filter((invoice) => invoice.buyer === buyerAddress);
    },
    enabled: !!buyerAddress,
  });
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      return getInvoice(BigInt(invoiceId));
    },
    enabled: !!invoiceId,
  });
}

export function useCreditScore(supplierAddress: string | null) {
  return useQuery({
    queryKey: ['creditScore', supplierAddress],
    queryFn: async () => {
      if (!supplierAddress) return 500;
      return getCreditScore(supplierAddress);
    },
    enabled: !!supplierAddress,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      supplier: string;
      buyerAddress: string;
      amount: string;
      discountRate: string;
      dueDate: string;
    }) => {
      if (!data.supplier) throw new Error('Wallet not connected');

      const amount = toStroops(data.amount);
      const discountBps = Math.round(Number.parseFloat(data.discountRate) * 100);
      const maturityTime = toTimestamp(data.dueDate);

      if (amount <= 0n) throw new Error('Amount must be greater than zero');

      const invoiceId = await createInvoice(
        data.supplier,
        data.buyerAddress,
        amount,
        discountBps,
        maturityTime
      );

      return { invoiceId: invoiceId.toString() };
    },
    onMutate: () => toast.loading('Creating invoice...', { id: 'create-invoice' }),
    onSuccess: () => {
      toast.success('Invoice created successfully', { id: 'create-invoice' });
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice', {
        id: 'create-invoice',
      });
    },
  });
}

export function useFundInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { investor: string; invoiceId: string; amount: string }) => {
      if (!data.investor) throw new Error('Wallet not connected');

      return fundInvoice(BigInt(data.invoiceId), data.investor, USDC_ADDRESS, toStroops(data.amount));
    },
    onMutate: () => toast.loading('Funding invoice...', { id: 'fund-invoice' }),
    onSuccess: () => {
      toast.success('Invoice funded', { id: 'fund-invoice' });
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['buyerInvoices'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Funding failed', { id: 'fund-invoice' });
    },
  });
}

export function useRepayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { buyer: string; invoiceId: string; amount: string }) => {
      if (!data.buyer) throw new Error('Wallet not connected');

      return repayInvoice(BigInt(data.invoiceId), data.buyer, USDC_ADDRESS, toStroops(data.amount));
    },
    onMutate: () => toast.loading('Submitting repayment...', { id: 'repay-invoice' }),
    onSuccess: () => {
      toast.success('Invoice repaid', { id: 'repay-invoice' });
      queryClient.invalidateQueries({ queryKey: ['buyerInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Repayment failed', {
        id: 'repay-invoice',
      });
    },
  });
}