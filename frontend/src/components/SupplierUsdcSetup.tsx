import { useState } from 'react'
import toast from 'react-hot-toast'
import { useWallet } from '../hooks/useWallet'
import { PREVIEW_MODE } from '../config'
import { establishSacUsdcTrust } from '../utils/soroban'

export function SupplierUsdcSetup() {
  const { account } = useWallet()
  const [dismissed, setDismissed] = useState(false)
  const [isPending, setIsPending] = useState(false)

  if (PREVIEW_MODE || !account || dismissed) return null

  const handleEnable = async () => {
    setIsPending(true)
    try {
      await establishSacUsdcTrust(account)
      toast.success('USDC payouts enabled for this wallet')
      setDismissed(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not enable USDC'
      toast.error(message, { duration: 8000 })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="card dashboard-card border-accent/30 space-y-3">
      <p className="text-sm leading-6 text-subtle">
        Before an investor can fund your invoices, this supplier wallet must be able to{' '}
        <strong className="text-accent">receive USDC</strong> on Testnet. Enable once (sign in
        your wallet).
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleEnable()}
        className="btn-primary w-full sm:w-auto"
      >
        {isPending ? 'Enabling…' : 'Enable USDC payouts'}
      </button>
    </div>
  )
}
