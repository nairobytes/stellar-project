import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardTopBar } from './DashboardTopBar'
interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen theme-bg lg:flex lg:h-screen lg:overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-screen">
        <DashboardTopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="min-h-0 flex-1 lg:overflow-y-auto lg:overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
