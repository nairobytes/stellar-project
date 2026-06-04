import { CONTRACT_ADDRESS } from '../config'
import type { Invoice } from '../types'

const STORAGE_KEY = 'invoicefi-invoice-descriptions-v1'
const MAX_LENGTH = 280

type DescriptionStore = Record<string, string>

function storageKey(invoiceId: bigint | string): string {
  return `${CONTRACT_ADDRESS}:${invoiceId}`
}

function loadStore(): DescriptionStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DescriptionStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: DescriptionStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function normalizeInvoiceDescription(value: string): string {
  return value.trim().slice(0, MAX_LENGTH)
}

export function saveInvoiceDescription(invoiceId: bigint | string, description: string): void {
  const text = normalizeInvoiceDescription(description)
  if (!text) return
  const store = loadStore()
  store[storageKey(invoiceId)] = text
  writeStore(store)
}

export function getInvoiceDescription(invoiceId: bigint | string): string | undefined {
  return loadStore()[storageKey(invoiceId)]
}

export function attachInvoiceDescriptions(invoices: Invoice[]): Invoice[] {
  return invoices.map((invoice) => {
    const description = getInvoiceDescription(invoice.id)
    return description ? { ...invoice, description } : invoice
  })
}

export { MAX_LENGTH as INVOICE_DESCRIPTION_MAX_LENGTH }
