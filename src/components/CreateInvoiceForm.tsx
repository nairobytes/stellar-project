import { useForm } from 'react-hook-form'
import { useCreateInvoice } from '../hooks/useInvoices'
import { useWallet } from '../hooks/useWallet'
import { CreateInvoiceFormData } from '../types'
import toast from 'react-hot-toast'

export function CreateInvoiceForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateInvoiceFormData>()
  const { mutate: createInvoice, isPending } = useCreateInvoice()
  const { isConnected } = useWallet()

  const onSubmit = (data: CreateInvoiceFormData) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    createInvoice(data, {
      onSuccess: () => {
        reset()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h2 className="text-xl font-semibold text-white">Create Invoice</h2>

      {/* Buyer Address */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Buyer Stellar Address
        </label>
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
          <p className="text-red-400 text-sm mt-1">{errors.buyerAddress.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Invoice Amount (USDC)
        </label>
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
        {errors.amount && (
          <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      {/* Discount Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Discount Rate (%)
        </label>
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
          <p className="text-red-400 text-sm mt-1">{errors.discountRate.message}</p>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Due Date
        </label>
        <input
          type="date"
          className="input-field"
          {...register('dueDate', {
            required: 'Due date is required',
          })}
        />
        {errors.dueDate && (
          <p className="text-red-400 text-sm mt-1">{errors.dueDate.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !isConnected}
        className="btn-primary w-full"
      >
        {isPending ? 'Creating...' : 'Create Invoice'}
      </button>
    </form>
  )
}
