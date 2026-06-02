import { useForm } from 'react-hook-form'
import { useFundInvoice } from '../hooks/useInvoices'
import { useWallet } from '../hooks/useWallet'
import { FundInvoiceFormData } from '../types'
import { BadgeDollarSign, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

export function FundInvoiceForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FundInvoiceFormData>()
  const { mutate: fundInvoice, isPending } = useFundInvoice()
  const { isConnected, account } = useWallet()

  const onSubmit = (data: FundInvoiceFormData) => {
    if (!isConnected) {
      toast.error('Wallet not connected')
      return
    }

    fundInvoice({ investor: account || '', invoiceId: data.invoiceId, amount: data.amount }, {
      onSuccess: () => {
        reset()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(11,31,58,0.08)]">
      <div>
        <h2 className="text-2xl font-semibold text-[#0B1F3A]">Fund Invoice</h2>
        <p className="text-sm text-slate-500">Investor funding workflow</p>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Hash className="h-4 w-4 text-[#3E7BFA]" />
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
        {errors.invoiceId && <p className="mt-1 text-sm text-[#FF6B35]">{errors.invoiceId.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
          <BadgeDollarSign className="h-4 w-4 text-[#3E7BFA]" />
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
        {errors.amount && <p className="mt-1 text-sm text-[#FF6B35]">{errors.amount.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending || !isConnected}
        className="w-full rounded-2xl bg-[#00C48C] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#00ad7a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Funding...' : 'Fund Invoice'}
      </button>
    </form>
  )
}
