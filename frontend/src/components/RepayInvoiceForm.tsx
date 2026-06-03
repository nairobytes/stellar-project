import { useForm } from 'react-hook-form'
import { useRepayInvoice } from '../hooks/useInvoices'
import { PREVIEW_MODE } from '../config'
import { useWallet } from '../hooks/useWallet'
import { RepayInvoiceFormData } from '../types'

export function RepayInvoiceForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RepayInvoiceFormData>()
  const { mutate: repayInvoice, isPending } = useRepayInvoice()
  const { account } = useWallet()

  const onSubmit = (data: RepayInvoiceFormData) => {
    repayInvoice({ ...data, buyer: account || '' }, {
      onSuccess: () => {
        reset()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card dashboard-card space-y-5">
      <div>
        <p className="section-label mb-2">Buyer</p>
        <h3 className="font-serif text-xl font-semibold theme-heading">Repay invoice</h3>
      </div>

      <div>
        <label className="input-label">Invoice ID</label>
        <input
          type="number"
          placeholder="1"
          className="input-field"
          {...register('invoiceId', {
            required: 'Invoice ID is required',
          })}
        />
        {errors.invoiceId && (
          <p className="mt-1 text-sm text-error">{errors.invoiceId.message}</p>
        )}
      </div>

      <div>
        <label className="input-label">Repayment amount (USDC)</label>
        <input
          type="number"
          step="0.01"
          placeholder="1000.00"
          className="input-field"
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
        />
        {errors.amount && <p className="mt-1 text-sm text-error">{errors.amount.message}</p>}
      </div>

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Repaying…' : PREVIEW_MODE ? 'Repay invoice (preview)' : 'Repay invoice'}
      </button>
    </form>
  )
}
