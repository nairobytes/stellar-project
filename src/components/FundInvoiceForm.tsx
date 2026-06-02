import { useForm } from 'react-hook-form'
import { useFundInvoice } from '../hooks/useInvoices'
import { useWallet } from '../hooks/useWallet'
import { FundInvoiceFormData } from '../types'
import toast from 'react-hot-toast'

export function FundInvoiceForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FundInvoiceFormData>()
  const { mutate: fundInvoice, isPending } = useFundInvoice()
  const { isConnected } = useWallet()

  const onSubmit = (data: FundInvoiceFormData) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    fundInvoice(data, {
      onSuccess: () => {
        reset()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h2 className="text-xl font-semibold text-white">Fund Invoice</h2>

      {/* Invoice ID */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Invoice ID
        </label>
        <input
          type="number"
          placeholder="1"
          className="input-field"
          {...register('invoiceId', {
            required: 'Invoice ID is required',
          })}
        />
        {errors.invoiceId && (
          <p className="text-red-400 text-sm mt-1">{errors.invoiceId.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Fund Amount (USDC)
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="500.00"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !isConnected}
        className="btn-success w-full"
      >
        {isPending ? 'Funding...' : 'Fund Invoice'}
      </button>
    </form>
  )
}
