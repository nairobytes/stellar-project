import type { ReactNode } from 'react'
import { useInView } from '../hooks/useInView'

type RevealSide = 'left' | 'right'

interface DashboardRevealProps {
  side: RevealSide
  children: ReactNode
  className?: string
  delayMs?: number
}

export function DashboardReveal({
  side,
  children,
  className = '',
  delayMs = 0,
}: DashboardRevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12)

  return (
    <div
      ref={ref}
      className={`dashboard-reveal dashboard-reveal-${side} ${inView ? 'is-visible' : ''} ${className}`.trim()}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
