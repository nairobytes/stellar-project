import { PREVIEW_MODE } from '../config'

export function PreviewBanner() {
  if (!PREVIEW_MODE) return null

  return (
    <div className="mb-8 border theme-border theme-accent-wash px-5 py-4">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Preview mode</p>
      <p className="mt-1 text-sm theme-muted">
        Dashboards show sample data. Wallet connect is disabled until Freighter integration
        is ready.
      </p>
    </div>
  )
}
