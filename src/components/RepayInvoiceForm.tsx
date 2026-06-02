import { useForm } from 'react-hook-form'
import { useRepayInvoice } from '../hooks/useInvoices'
import { useWallet } from '../hooks/useWallet'
import { RepayInvoiceFormData } from '../types'
import toast from 'react-hot-toast'

export function RepayInvoiceForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RepayInvoiceFormData>()
  const { mutate: repayInvoice, isPending } = useRepayInvoice()
  const { isConnected } = useWallet()

  const onSubmit = (data: RepayInvoiceFormData) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    repayInvoice(data, {
      onSuccess: () => {
        reset()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h2 className="text-xl font-semibold text-white">Repay Invoice</h2>

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

      {/* Repayment Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Repayment Amount (USDC)
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !isConnected}
        className="btn-success w-full"
      >
        {isPending ? 'Repaying...' : 'Repay Invoice'}
      </button>
    </form>
  )
}
