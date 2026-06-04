import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDisplay(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

interface DueDatePickerProps {
  id?: string
  value: string
  onChange: (isoDate: string) => void
  onBlur?: () => void
  error?: string
  placeholder?: string
}

export function DueDatePicker({
  id,
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'Select due date',
}: DueDatePickerProps) {
  const fallbackId = useId()
  const pickerId = id ?? fallbackId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const minDate = useMemo(() => addDays(startOfDay(new Date()), 1), [])
  const minIso = toIsoDate(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())

  const initialView = value ? parseIsoDate(value) ?? minDate : minDate
  const [viewYear, setViewYear] = useState(initialView.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialView.getMonth())

  useEffect(() => {
    if (!open) return
    const selected = parseIsoDate(value)
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        onBlur?.()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onBlur])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const items: Array<{ day: number; iso: string; disabled: boolean } | null> = []

    for (let i = 0; i < startPad; i++) items.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIsoDate(viewYear, viewMonth, day)
      items.push({
        day,
        iso,
        disabled: iso < minIso,
      })
    }
    return items
  }, [viewYear, viewMonth, minIso])

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const selectDate = (iso: string) => {
    onChange(iso)
    setOpen(false)
    onBlur?.()
  }

  return (
    <div ref={rootRef} className="due-date-picker relative">
      <button
        type="button"
        id={pickerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`input-field due-date-picker-trigger flex w-full items-center justify-between gap-3 text-left ${
          error ? 'border-[var(--error)]' : ''
        }`}
      >
        <span className={value ? 'theme-heading' : 'text-subtle'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose due date"
          className="due-date-picker-popover absolute left-0 right-0 z-20 mt-2 border theme-border theme-card p-4 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center border theme-border text-accent hover:border-[var(--accent)]"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium theme-heading">{monthLabel}</p>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center border theme-border text-accent hover:border-[var(--accent)]"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-subtle">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, idx) =>
              cell === null ? (
                <span key={`empty-${idx}`} />
              ) : (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => selectDate(cell.iso)}
                  className={`due-date-picker-day h-9 w-full text-sm transition ${
                    value === cell.iso
                      ? 'bg-[var(--accent)] font-semibold text-white'
                      : cell.disabled
                        ? 'cursor-not-allowed text-subtle opacity-40'
                        : 'theme-heading hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]'
                  }`}
                >
                  {cell.day}
                </button>
              )
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-subtle">
            Maturity must be after today (Stellar Testnet ledger time).
          </p>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
