export const DASHBOARD_PATHS = ['/supplier', '/investor', '/buyer'] as const

export const DASHBOARD_SHELL_PATHS = [...DASHBOARD_PATHS, '/settings'] as const

export const DASHBOARD_ROLE_LABELS: Record<string, string> = {
  '/supplier': 'Supplier dashboard',
  '/investor': 'Investor dashboard',
  '/buyer': 'Buyer dashboard',
}

export function isDashboardShellPath(pathname: string): boolean {
  return (DASHBOARD_SHELL_PATHS as readonly string[]).includes(pathname)
}
