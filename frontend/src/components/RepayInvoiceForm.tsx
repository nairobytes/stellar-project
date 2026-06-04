import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useBuyerInvoices, useRepayInvoice } from '../hooks/useInvoices'
import { PREVIEW_MODE } from '../config'
import { useWallet } from '../hooks/useWallet'
import { RepayInvoiceFormData } from '../types'
import { formatUSDC } from '../utils/format'
import type { Invoice } from '../types'

function isRepayable(status: Invoice['status']): boolean {
  return status === 'Funded' || status === 'Overdue'
}

interface RepayInvoiceFormProps {
  selectedInvoiceId?: string
  onSelectedInvoiceIdChange?: (id: string) => void
}

export function RepayInvoiceForm({
  selectedInvoiceId = '',
  onSelectedInvoiceIdChange,
}: RepayInvoiceFormProps) {
  const { account } = useWallet()
  const { data: invoices } = useBuyerInvoices(account)
  const list = invoices ?? []
  const repayable = useMemo(() => list.filter((inv) => isRepayable(inv.status)), [list])
  const pendingCount = list.filter((inv) => inv.status === 'Pending').length

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RepayInvoiceFormData>({
    defaultValues: { invoiceId: '', amount: '' },
  })

  const invoiceIdField = register('invoiceId', { required: 'Select an invoice' })
  const { mutate: repayInvoice, isPending } = useRepayInvoice()
  const [formError, setFormError] = useState<string | null>(null)

  const watchedId = watch('invoiceId')
  const selected = repayable.find((inv) => inv.id.toString() === (watchedId || selectedInvoiceId))

  useEffect(() => {
    if (selectedInvoiceId) {
      setValue('invoiceId', selectedInvoiceId)
    }
  }, [selectedInvoiceId, setValue])

  useEffect(() => {
    if (selected) {
      setValue('amount', formatUSDC(selected.amount))
    }
  }, [selected, setValue])

  const onSubmit = (data: RepayInvoiceFormData) => {
    setFormError(null)
    repayInvoice(
      { invoiceId: data.invoiceId, buyer: account || '' },
      {
        onSuccess: () => {
          reset()
          onSelectedInvoiceIdChange?.('')
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Repayment failed'
          setFormError(message)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card dashboard-card space-y-5">
      <div>
        <p className="section-label mb-2">Buyer</p>
        <h3 className="font-serif text-xl font-semibold theme-heading">Repay invoice</h3>
        <p className="mt-2 text-sm leading-6 text-subtle">
          Repayment is only available after an investor funds the invoice (status Funded or Overdue).
          You repay the full face value in USDC; the contract handles the split.
        </p>
      </div>

      {repayable.length === 0 ? (
        <div className="border theme-border theme-accent-wash p-4 text-sm leading-6 text-subtle">
          {pendingCount > 0 ? (
            <>
              You have {pendingCount} invoice{pendingCount === 1 ? '' : 's'} still{' '}
              <strong className="text-accent">Pending</strong> — waiting for investor funding. Repay
              unlocks once one is funded.
            </>
          ) : list.length === 0 ? (
            <>No invoices linked to your wallet yet.</>
          ) : (
            <>Nothing ready to repay right now (already repaid or not yet funded).</>
          )}
        </div>
      ) : (
        <>
          <div>
            <label className="input-label" htmlFor="repay-invoice-id">
              Invoice to repay
            </label>
            <select
              id="repay-invoice-id"
              className="input-field"
              name={invoiceIdField.name}
              ref={invoiceIdField.ref}
              onBlur={invoiceIdField.onBlur}
              onChange={(e) => {
                void invoiceIdField.onChange(e)
                onSelectedInvoiceIdChange?.(e.target.value)
              }}
            >
              <option value="">Select…</option>
              {repayable.map((inv) => (
                <option key={inv.id.toString()} value={inv.id.toString()}>
                  #{inv.id.toString()} — ${formatUSDC(inv.amount)} ({inv.status})
                </option>
              ))}
            </select>
            {errors.invoiceId && (
              <p className="mt-1 text-sm text-error">{errors.invoiceId.message}</p>
            )}
          </div>

          <div>
            <label className="input-label">Amount due (USDC)</label>
            <input
              type="text"
              readOnly
              className="input-field opacity-80"
              placeholder="Select an invoice"
              {...register('amount')}
            />
            <p className="mt-1 text-xs leading-5 text-subtle">
              Fixed on-chain face value — must match exactly when you sign in your wallet.
            </p>
          </div>

          {formError && (
            <div className="alert-error text-sm leading-6" role="alert">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !selected}
            className="btn-primary w-full"
          >
            {isPending ? 'Repaying…' : PREVIEW_MODE ? 'Repay invoice (preview)' : 'Repay invoice'}
          </button>
        </>
      )}
    </form>
  )
}
