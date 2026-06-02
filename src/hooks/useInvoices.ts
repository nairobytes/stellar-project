import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Invoice } from '../types'
import toast from 'react-hot-toast'

// Mock data for development - replace with actual contract calls
const mockInvoices: Invoice[] = [
  {
    id: BigInt(1),
    supplier: 'GBBD47UZQ5EDUJF5MACIXGVS77CNKWVDBLHH2WRZWQHG5CDXHK67DQJS',
    buyer: 'GBU7K6UYUAFQKLZ6DZPWG7RMABPVJHVTF6D5XXSQ5YNBUYVS75IHVP45',
    amount: BigInt('1000000000'),
    discount_bps: 500,
    funded_amount: BigInt('500000000'),
    status: 'Funded' as const,
    maturity_time: BigInt(Math.floor(Date.now() / 1000) + 30 * 86400),
    investor: 'GC2V2IYJW5LYSDYBW4S3LBXBXEYSRX7MHAIPYSXY63XDXWGBN5ZHVVHE',
    creation_time: BigInt(Math.floor(Date.now() / 1000) - 86400),
    repaid_amount: BigInt(0),
  },
]

// Fetch invoices for supplier
export function useSupplierInvoices(supplierAddress: string | null) {
  return useQuery({
    queryKey: ['supplierInvoices', supplierAddress],
    queryFn: async () => {
      if (!supplierAddress) return []
      // TODO: Replace with actual contract call
      return mockInvoices.filter((inv) => inv.supplier === supplierAddress)
    },
    enabled: !!supplierAddress,
  })
}

// Fetch all pending invoices for investor
export function usePendingInvoices() {
  return useQuery({
    queryKey: ['pendingInvoices'],
    queryFn: async () => {
      // TODO: Replace with actual contract call
      return mockInvoices.filter((inv) => inv.status === 'Pending')
    },
  })
}

// Fetch invoices for buyer
export function useBuyerInvoices(buyerAddress: string | null) {
  return useQuery({
    queryKey: ['buyerInvoices', buyerAddress],
    queryFn: async () => {
      if (!buyerAddress) return []
      // TODO: Replace with actual contract call
      return mockInvoices.filter((inv) => inv.buyer === buyerAddress)
    },
    enabled: !!buyerAddress,
  })
}

// Fetch single invoice
export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null
      // TODO: Replace with actual contract call
      const invoice = mockInvoices.find((inv) => inv.id.toString() === invoiceId)
      return invoice || null
    },
    enabled: !!invoiceId,
  })
}

// Fetch credit score
export function useCreditScore(supplierAddress: string | null) {
  return useQuery({
    queryKey: ['creditScore', supplierAddress],
    queryFn: async () => {
      if (!supplierAddress) return 500
      // TODO: Replace with actual contract call
      return 750
    },
    enabled: !!supplierAddress,
  })
}

// Create invoice mutation
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      buyerAddress: string
      amount: string
      discountRate: string
      dueDate: string
    }) => {
      // TODO: Implement actual contract call
      toast.loading('Creating invoice...')
      return {
        invoiceId: '1',
        ...data,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] })
      toast.success('Invoice created successfully!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice')
    },
  })
}

// Fund invoice mutation
export function useFundInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { invoiceId: string; amount: string }) => {
      // TODO: Implement actual contract call
      toast.loading('Funding invoice...')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] })
      toast.success('Invoice funded successfully!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to fund invoice')
    },
  })
}

// Repay invoice mutation
export function useRepayInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { invoiceId: string; amount: string }) => {
      // TODO: Implement actual contract call
      toast.loading('Repaying invoice...')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerInvoices'] })
      toast.success('Invoice repaid successfully!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to repay invoice')
    },
  })
}
