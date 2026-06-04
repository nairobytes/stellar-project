import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useFundInvoice, usePendingInvoices } from '../hooks/useInvoices'
import { PREVIEW_MODE } from '../config'
import { useWallet } from '../hooks/useWallet'
import { FundInvoiceFormData } from '../types'
import { formatUSDC } from '../utils/format'

export function FundInvoiceForm() {
  const { account } = useWallet()
  const { data: pending } = usePendingInvoices()
  const list = useMemo(() => pending ?? [], [pending])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FundInvoiceFormData>({ defaultValues: { invoiceId: '', amount: '' } })

  const invoiceIdField = register('invoiceId', { required: 'Select an invoice' })
  const watchedId = watch('invoiceId')
  const selected = list.find((inv) => inv.id.toString() === watchedId)

  useEffect(() => {
    if (selected) {
      setValue('amount', formatUSDC(selected.funded_amount))
    }
  }, [selected, setValue])

  const { mutate: fundInvoice, isPending } = useFundInvoice()

  const onSubmit = (data: FundInvoiceFormData) => {
    fundInvoice({ invoiceId: data.invoiceId, investor: account || '' }, {
      onSuccess: () => reset(),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card dashboard-card space-y-5">
      <div>
        <p className="section-label mb-2">Investor</p>
        <h3 className="font-serif text-xl font-semibold theme-heading">Fund invoice</h3>
        <p className="mt-2 text-sm leading-6 text-subtle">
          You pay the discounted amount (face value minus supplier discount). Amount is set by the
          contract.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-subtle">No pending invoices available to fund.</p>
      ) : (
        <>
          <div>
            <label className="input-label" htmlFor="fund-invoice-id">
              Pending invoice
            </label>
            <select id="fund-invoice-id" className="input-field" name={invoiceIdField.name} ref={invoiceIdField.ref} onBlur={invoiceIdField.onBlur} onChange={invoiceIdField.onChange}>
              <option value="">Select…</option>
              {list.map((inv) => (
                <option key={inv.id.toString()} value={inv.id.toString()}>
                  #{inv.id.toString()} — pay ${formatUSDC(inv.funded_amount)} (face ${formatUSDC(inv.amount)})
                </option>
              ))}
            </select>
            {errors.invoiceId && (
              <p className="mt-1 text-sm text-error">{errors.invoiceId.message}</p>
            )}
          </div>

          <div>
            <label className="input-label">You will transfer (USDC)</label>
            <input type="text" readOnly className="input-field opacity-80" {...register('amount')} />
          </div>

          <button type="submit" disabled={isPending || !selected} className="btn-primary w-full">
            {isPending ? 'Funding…' : PREVIEW_MODE ? 'Fund invoice (preview)' : 'Fund invoice'}
          </button>
        </>
      )}
    </form>
  )
}
