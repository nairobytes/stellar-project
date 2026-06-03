import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'

interface AnimatedNumberProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  durationMs?: number
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = 'stat-value',
  durationMs = 900,
}: AnimatedNumberProps) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.35)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return

    let frame = 0
    const start = performance.now()
    const from = 0
    const to = value

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, durationMs])

  const formatted =
    decimals > 0
      ? display.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(display).toLocaleString('en-US')

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
