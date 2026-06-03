import { useForm } from 'react-hook-form'
import { useCreateInvoice } from '../hooks/useInvoices'
import { PREVIEW_MODE } from '../config'
import { useWallet } from '../hooks/useWallet'
import { CreateInvoiceFormData } from '../types'

export function CreateInvoiceForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>()
  const { mutate: createInvoice, isPending } = useCreateInvoice()
  const { account } = useWallet()

  const onSubmit = (data: CreateInvoiceFormData) => {
    createInvoice({ ...data, supplier: account || '' }, {
      onSuccess: () => {
        reset()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
      <div>
        <p className="section-label mb-2">Supplier</p>
        <h3 className="font-serif text-xl font-semibold theme-heading">Create invoice</h3>
      </div>

      <div>
        <label className="input-label">Buyer Stellar address</label>
        <input
          type="text"
          placeholder="G..."
          className="input-field"
          {...register('buyerAddress', {
            required: 'Buyer address is required',
            pattern: {
              value: /^G[A-Z0-9]{55}$/,
              message: 'Invalid Stellar address',
            },
          })}
        />
        {errors.buyerAddress && (
          <p className="mt-1 text-sm text-error">{errors.buyerAddress.message}</p>
        )}
      </div>

      <div>
        <label className="input-label">Invoice amount (USDC)</label>
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

      <div>
        <label className="input-label">Discount rate (%)</label>
        <input
          type="number"
          step="0.01"
          placeholder="5"
          className="input-field"
          {...register('discountRate', {
            required: 'Discount rate is required',
            min: { value: 0, message: 'Discount must be >= 0' },
            max: { value: 100, message: 'Discount must be <= 100' },
          })}
        />
        {errors.discountRate && (
          <p className="mt-1 text-sm text-error">{errors.discountRate.message}</p>
        )}
      </div>

      <div>
        <label className="input-label">Due date</label>
        <input
          type="date"
          className="input-field"
          {...register('dueDate', {
            required: 'Due date is required',
          })}
        />
        {errors.dueDate && <p className="mt-1 text-sm text-error">{errors.dueDate.message}</p>}
      </div>

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Creating…' : PREVIEW_MODE ? 'Create invoice (preview)' : 'Create invoice'}
      </button>
    </form>
  )
}
