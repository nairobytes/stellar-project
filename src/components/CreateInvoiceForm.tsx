import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useCreateInvoice } from '../hooks/useInvoices'
import { useWallet } from '../hooks/useWallet'
import { CreateInvoiceFormData } from '../types'
import { INVESTOR_YIELD_BPS } from '../config'
import { formatUSDC } from '../utils/format'
import { AlertCircle, CalendarDays, BadgeDollarSign, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

export function CreateInvoiceForm() {
  const { register, handleSubmit, reset, formState: { errors }, control } = useForm<CreateInvoiceFormData>()
  const { mutate: createInvoice, isPending } = useCreateInvoice()
  const { isConnected, account } = useWallet()
  const amount = useWatch({ control, name: 'amount' })
  const discountRate = useWatch({ control, name: 'discountRate' })

  const yieldPreview = useMemo(() => {
    const parsedAmount = Number.parseFloat(amount || '0')
    const parsedDiscount = Number.parseFloat(discountRate || '0')
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return '0.00'
    return ((parsedAmount * (parsedDiscount || INVESTOR_YIELD_BPS / 100)) / 100).toFixed(2)
  }, [amount, discountRate])

  const onSubmit = (data: CreateInvoiceFormData) => {
    if (!isConnected) {
      toast.error('Wallet not connected')
      return
    }

    createInvoice({
      supplier: account || '',
      buyerAddress: data.buyerAddress,
      amount: data.amount,
      discountRate: data.discountRate,
      dueDate: data.dueDate,
    }, {
      onSuccess: () => {
        reset()
      },
    })
  }

  const buyerLength = (useWatch({ control, name: 'buyerAddress' }) || '').length

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(11,31,58,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#0B1F3A]">Create Invoice</h2>
          <p className="text-sm text-slate-500">Supplier onboarding for a new financing round</p>
        </div>
        <div className="rounded-full bg-[#0B1F3A]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0B1F3A]">
          Live Yield Preview
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Hash className="h-4 w-4 text-[#3E7BFA]" />
            Buyer Stellar Address
          </label>
          <input
            type="text"
            placeholder="G..."
            className="input-field"
            {...register('buyerAddress', {
              required: 'Buyer address is required',
              pattern: {
                value: /^[CG][A-Z0-9]{55}$/,
                message: 'Invalid Stellar address',
              },
            })}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{buyerLength} characters</span>
            <span>{account ? 'Connected wallet ready' : 'Connect wallet to submit'}</span>
          </div>
          {errors.buyerAddress && (
            <p className="mt-1 flex items-center gap-1 text-sm text-[#FF6B35]"><AlertCircle className="h-4 w-4" />{errors.buyerAddress.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            <BadgeDollarSign className="h-4 w-4 text-[#3E7BFA]" />
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
          {errors.amount && <p className="mt-1 text-sm text-[#FF6B35]">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Discount Rate (%)</label>
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
          {errors.discountRate && <p className="mt-1 text-sm text-[#FF6B35]">{errors.discountRate.message}</p>}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarDays className="h-4 w-4 text-[#3E7BFA]" />
            Due Date
          </label>
          <input
            type="date"
            className="input-field"
            {...register('dueDate', {
              required: 'Due date is required',
            })}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-[#FF6B35]">{errors.dueDate.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Investor yield</div>
          <div className="mt-1 text-2xl font-semibold text-[#00C48C]">{yieldPreview}%</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Example funding</div>
          <div className="mt-1 text-lg font-semibold text-[#0B1F3A]">{formatUSDC('10000000')} USDC</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</div>
          <div className="mt-1 text-lg font-semibold text-[#0B1F3A]">Ready to submit</div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !isConnected}
        className="w-full rounded-2xl bg-[#3E7BFA] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#2f67e0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Creating...' : 'Create Invoice'}
      </button>
    </form>
  )
}
