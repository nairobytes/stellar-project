import { useId } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useCreateInvoice } from '../hooks/useInvoices'
import { PREVIEW_MODE } from '../config'
import { useWallet } from '../hooks/useWallet'
import { CreateInvoiceFormData } from '../types'
import { DueDatePicker } from './DueDatePicker'
import { InvoiceCreatedSteps } from './InvoiceCreatedSteps'
import { INVOICE_DESCRIPTION_MAX_LENGTH } from '../utils/invoiceMetadata'

export function CreateInvoiceForm() {
  const dueDateFieldId = useId()
  const {
    register,
    handleSubmit,
    reset,
    control,
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
    <form onSubmit={handleSubmit(onSubmit)} className="card dashboard-card space-y-5">
      <div>
        <p className="section-label mb-2">Supplier</p>
        <h3 className="font-serif text-xl font-semibold theme-heading">Create invoice</h3>
      </div>

      <div>
        <label className="input-label">What is this invoice for?</label>
        <textarea
          rows={3}
          placeholder="e.g. 200 bags cement — Westlands depot, PO #4421"
          className="input-field resize-y min-h-[5rem]"
          maxLength={INVOICE_DESCRIPTION_MAX_LENGTH}
          {...register('description', {
            maxLength: {
              value: INVOICE_DESCRIPTION_MAX_LENGTH,
              message: `Description must be ${INVOICE_DESCRIPTION_MAX_LENGTH} characters or less`,
            },
          })}
        />
        <p className="mt-1 text-xs leading-5 text-subtle">
          Optional — helps you tell invoices apart when you supply many goods or jobs.
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-error">{errors.description.message}</p>
        )}
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
            min: { value: 0.01, message: 'Discount must be at least 0.01%' },
            max: { value: 99.99, message: 'Discount must be below 100%' },
          })}
        />
        {errors.discountRate && (
          <p className="mt-1 text-sm text-error">{errors.discountRate.message}</p>
        )}
      </div>

      <div>
        <label className="input-label" htmlFor={dueDateFieldId}>
          Due date
        </label>
        <Controller
          name="dueDate"
          control={control}
          rules={{ required: 'Due date is required' }}
          render={({ field }) => (
            <DueDatePicker
              id={dueDateFieldId}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.dueDate?.message}
              placeholder="Select due date"
            />
          )}
        />
      </div>

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Creating…' : PREVIEW_MODE ? 'Create invoice (preview)' : 'Create invoice'}
      </button>

      <InvoiceCreatedSteps />
    </form>
  )
}
