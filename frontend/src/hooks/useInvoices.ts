import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Invoice } from '../types'
import { PREVIEW_MODE, STROOPS_PER_UNIT, USDC_ADDRESS } from '../config'
import {
  createInvoice,
  fundInvoice,
  getAllInvoices,
  getCreditScore,
  getInvoice,
  getSupplierInvoices,
  markOverdue,
  repayInvoice,
} from '../utils/soroban'
import {
  attachInvoiceDescriptions,
  saveInvoiceDescription,
} from '../utils/invoiceMetadata'

const DEMO_SUPPLIER = 'GBBD47UZQ5EDUJF5MACIXGVS77CNKWVDBLHH2WRZWQHG5CDXHK67DQJS'
const DEMO_BUYER = 'GBU7K6UYUAFQKLZ6DZPWG7RMABPVJHVTF6D5XXSQ5YNBUYVS75IHVP45'
const DEMO_INVESTOR = 'GC2V2IYJW5LYSDYBW4S3LBXBXEYSRX7MHAIPYSXY63XDXWGBN5ZHVVHE'

const now = Math.floor(Date.now() / 1000)

export const mockInvoices: Invoice[] = [
  {
    id: BigInt(1),
    supplier: DEMO_SUPPLIER,
    buyer: DEMO_BUYER,
    amount: BigInt('1000000000'),
    discount_bps: 500,
    funded_amount: BigInt('1000000000'),
    status: 'Funded',
    maturity_time: BigInt(now + 30 * 86400),
    investor: DEMO_INVESTOR,
    creation_time: BigInt(now - 5 * 86400),
    repaid_amount: BigInt(0),
  },
  {
    id: BigInt(2),
    supplier: DEMO_SUPPLIER,
    buyer: 'GBRHX2YIWWTCTSZ3G7QW6MHAIPYSXY63XDXWGBN5ZHVVHE',
    amount: BigInt('2500000000'),
    discount_bps: 450,
    funded_amount: BigInt(0),
    status: 'Pending',
    maturity_time: BigInt(now + 45 * 86400),
    investor: null,
    creation_time: BigInt(now - 2 * 86400),
    repaid_amount: BigInt(0),
  },
  {
    id: BigInt(3),
    supplier: DEMO_SUPPLIER,
    buyer: DEMO_BUYER,
    amount: BigInt('750000000'),
    discount_bps: 500,
    funded_amount: BigInt('750000000'),
    status: 'Repaid',
    maturity_time: BigInt(now - 10 * 86400),
    investor: DEMO_INVESTOR,
    creation_time: BigInt(now - 60 * 86400),
    repaid_amount: BigInt('787500000'),
  },
]

function toStroops(amount: string): bigint {
  const parsed = Number.parseFloat(amount)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0n
  return BigInt(Math.floor(parsed * STROOPS_PER_UNIT))
}

function toTimestamp(date: string): bigint {
  return BigInt(Math.floor(new Date(date).getTime() / 1000))
}

async function autoMarkOverdue(invoiceId: bigint, maturityTime: bigint, status: string) {
  if (PREVIEW_MODE || status !== 'Funded') return
  if (BigInt(Math.floor(Date.now() / 1000)) <= maturityTime) return
  try {
    await markOverdue(invoiceId)
  } catch {
    // background sync only
  }
}

export function useSupplierInvoices(supplierAddress: string | null) {
  return useQuery({
    queryKey: ['supplierInvoices', supplierAddress, PREVIEW_MODE],
    queryFn: async () => {
      if (PREVIEW_MODE) {
        return mockInvoices.filter((inv) => inv.supplier === DEMO_SUPPLIER)
      }
      if (!supplierAddress) return []
      const ids = await getSupplierInvoices(supplierAddress)
      const loaded = await Promise.all(ids.map((id) => getInvoice(id)))
      await Promise.all(
        loaded.map((invoice) =>
          autoMarkOverdue(invoice.id, invoice.maturity_time, invoice.status)
        )
      )
      const refreshedIds = await getSupplierInvoices(supplierAddress)
      const refreshed = await Promise.all(refreshedIds.map((id) => getInvoice(id)))
      return attachInvoiceDescriptions(refreshed)
    },
    enabled: PREVIEW_MODE || !!supplierAddress,
  })
}

export function usePendingInvoices() {
  return useQuery({
    queryKey: ['pendingInvoices', PREVIEW_MODE],
    queryFn: async () => {
      if (PREVIEW_MODE) {
        return mockInvoices.filter((inv) => inv.status === 'Pending')
      }
      const invoices = await getAllInvoices()
      await Promise.all(
        invoices.map((invoice) =>
          autoMarkOverdue(invoice.id, invoice.maturity_time, invoice.status)
        )
      )
      const refreshed = await getAllInvoices()
      return attachInvoiceDescriptions(
        refreshed.filter((invoice) => invoice.status === 'Pending')
      )
    },
  })
}

export function useBuyerInvoices(buyerAddress: string | null) {
  return useQuery({
    queryKey: ['buyerInvoices', buyerAddress, PREVIEW_MODE],
    queryFn: async () => {
      if (PREVIEW_MODE) {
        return mockInvoices.filter((inv) => inv.buyer === DEMO_BUYER)
      }
      if (!buyerAddress) return []
      const invoices = await getAllInvoices()
      const ownInvoices = invoices.filter((invoice) => invoice.buyer === buyerAddress)
      await Promise.all(
        ownInvoices.map((invoice) =>
          autoMarkOverdue(invoice.id, invoice.maturity_time, invoice.status)
        )
      )
      const refreshed = await getAllInvoices()
      return attachInvoiceDescriptions(
        refreshed.filter((invoice) => invoice.buyer === buyerAddress)
      )
    },
    enabled: PREVIEW_MODE || !!buyerAddress,
  })
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ['invoice', invoiceId, PREVIEW_MODE],
    queryFn: async () => {
      if (!invoiceId) return null
      if (PREVIEW_MODE) {
        return mockInvoices.find((inv) => inv.id.toString() === invoiceId) || null
      }
      return getInvoice(BigInt(invoiceId))
    },
    enabled: !!invoiceId,
  })
}

export function useCreditScore(supplierAddress: string | null) {
  return useQuery({
    queryKey: ['creditScore', supplierAddress, PREVIEW_MODE],
    queryFn: async () => {
      if (PREVIEW_MODE) return 750
      if (!supplierAddress) return 500
      return getCreditScore(supplierAddress)
    },
    enabled: PREVIEW_MODE || !!supplierAddress,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      supplier?: string
      buyerAddress: string
      description?: string
      amount: string
      discountRate: string
      dueDate: string
    }) => {
      if (PREVIEW_MODE) {
        toast('Preview mode — connect wallet to create invoices', { icon: '👀' })
        return { invoiceId: 'preview', ...data }
      }
      if (!data.supplier) throw new Error('Wallet not connected')
      const amount = toStroops(data.amount)
      const discountBps = Math.round(Number.parseFloat(data.discountRate) * 100)
      const maturityTime = toTimestamp(data.dueDate)
      if (amount <= 0n) throw new Error('Amount must be greater than zero')
      if (discountBps <= 0 || discountBps >= 10_000) {
        throw new Error('Discount must be between 0.01% and 99.99% (contract uses basis points)')
      }
      if (maturityTime <= BigInt(Math.floor(Date.now() / 1000))) {
        throw new Error('Due date must be in the future')
      }
      const invoiceId = await createInvoice(
        data.supplier,
        data.buyerAddress,
        amount,
        discountBps,
        maturityTime
      )
      return {
        invoiceId: invoiceId.toString(),
        description: data.description?.trim() ?? '',
      }
    },
    onMutate: () => {
      if (!PREVIEW_MODE) toast.loading('Creating invoice...', { id: 'create-invoice' })
    },
    onSuccess: (result) => {
      if (PREVIEW_MODE) return
      if (result.description) {
        saveInvoiceDescription(result.invoiceId, result.description)
      }
      toast.success('Invoice created successfully', { id: 'create-invoice' })
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create invoice'
      toast.error(message, { id: 'create-invoice' })
      // Tx may have landed on-chain before a client parse error (e.g. meta v4)
      if (/bad union switch/i.test(message)) {
        queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] })
      }
    },
  })
}

export function useFundInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { investor?: string; invoiceId: string; amount: string }) => {
      if (PREVIEW_MODE) {
        toast('Preview mode — connect wallet to fund invoices', { icon: '👀' })
        return data
      }
      if (!data.investor) throw new Error('Wallet not connected')
      return fundInvoice(
        BigInt(data.invoiceId),
        data.investor,
        USDC_ADDRESS,
        toStroops(data.amount)
      )
    },
    onMutate: () => {
      if (!PREVIEW_MODE) toast.loading('Funding invoice...', { id: 'fund-invoice' })
    },
    onSuccess: () => {
      if (PREVIEW_MODE) return
      toast.success('Invoice funded', { id: 'fund-invoice' })
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['buyerInvoices'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Funding failed', { id: 'fund-invoice' })
    },
  })
}

export function useRepayInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { buyer?: string; invoiceId: string; amount: string }) => {
      if (PREVIEW_MODE) {
        toast('Preview mode — connect wallet to repay invoices', { icon: '👀' })
        return data
      }
      if (!data.buyer) throw new Error('Wallet not connected')
      return repayInvoice(
        BigInt(data.invoiceId),
        data.buyer,
        USDC_ADDRESS,
        toStroops(data.amount)
      )
    },
    onMutate: () => {
      if (!PREVIEW_MODE) toast.loading('Submitting repayment...', { id: 'repay-invoice' })
    },
    onSuccess: () => {
      if (PREVIEW_MODE) return
      toast.success('Invoice repaid', { id: 'repay-invoice' })
      queryClient.invalidateQueries({ queryKey: ['buyerInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Repayment failed', {
        id: 'repay-invoice',
      })
    },
  })
}
