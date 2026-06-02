import { STROOPS_PER_UNIT, BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS } from '../config'

// Format amount in USDC (stroops to human readable)
export function formatUSDC(stroops: string | bigint): string {
  const num = typeof stroops === 'string' ? BigInt(stroops) : stroops
  const amount = Number(num) / STROOPS_PER_UNIT
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  })
}

// Format percentage
export function formatPercent(bps: number): string {
  return (bps / 100).toFixed(2) + '%'
}

// Format basis points
export function formatBasisPoints(bps: number): string {
  return (bps / 100).toFixed(2) + '%'
}

// Truncate address
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) return address
  return address.slice(0, start) + '...' + address.slice(-end)
}

// Format date
export function formatDate(timestamp: string | bigint): string {
  const num = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp)
  const date = new Date(num * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format date time
export function formatDateTime(timestamp: string | bigint): string {
  const num = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp)
  const date = new Date(num * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Calculate days until maturity
export function daysUntilMaturity(maturityTime: string | bigint): number {
  const num = typeof maturityTime === 'string' ? parseInt(maturityTime) : Number(maturityTime)
  const now = Math.floor(Date.now() / 1000)
  const daysLeft = Math.ceil((num - now) / 86400)
  return Math.max(daysLeft, 0)
}

// Format status with color
export function getStatusBadgeClass(status: string): string {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'pending':
      return 'badge-pending'
    case 'funded':
      return 'badge-funded'
    case 'repaid':
      return 'badge-repaid'
    case 'overdue':
      return 'badge-overdue'
    case 'defaulted':
      return 'badge-defaulted'
    default:
      return 'badge-pending'
  }
}

// Calculate investor yield
export function calculateInvestorYield(principal: string | bigint): string {
  const num = typeof principal === 'string' ? BigInt(principal) : principal
  const yield_amount = (num * BigInt(INVESTOR_YIELD_BPS)) / BigInt(BASIS_POINTS_DIVISOR)
  return yield_amount.toString()
}

// Format credit score with color
export function getCreditScoreColor(score: number): string {
  if (score >= 800) return 'text-emerald-700'
  if (score >= 700) return 'text-stellar'
  if (score >= 600) return 'text-amber-700'
  return 'text-red-700'
}

// Convert string to bigint safely
export function stringToBigint(value: string): bigint {
  try {
    return BigInt(value)
  } catch {
    return BigInt(0)
  }
}
