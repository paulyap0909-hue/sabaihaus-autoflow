import { useEffect, useState } from 'react'
import type { AppNavigationState, PageKey } from '../types/navigation'

const pathToPage: Record<string, PageKey> = {
  '/dashboard': 'dashboard',
  '/appointments': 'appointments',
  '/customers': 'customers',
  '/wellness-profiles': 'wellness-profiles',
  '/packages': 'packages',
  '/therapists': 'therapists',
  '/commission-center': 'commission-center',
  '/memberships': 'memberships',
  '/inventory-center': 'inventory-center',
  '/communication': 'communication',
  '/reports': 'reports',
  '/settings': 'settings',
  '/admin/system-health': 'admin-system-health',
}

const pageToPath = Object.fromEntries(
  Object.entries(pathToPage).map(([path, page]) => [page, path]),
) as Record<PageKey, string>

function getPageFromPath(): PageKey {
  return pathToPage[window.location.pathname] ?? 'dashboard'
}

export function useAppNavigation(): AppNavigationState {
  const [currentPage, setCurrentPage] = useState<PageKey>(getPageFromPath)

  useEffect(() => {
    if (
      !pathToPage[window.location.pathname] &&
      window.location.pathname !== '/login'
    ) {
      window.history.replaceState({}, '', '/dashboard')
    }

    const handlePopState = () => setCurrentPage(getPageFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (page: PageKey) => {
    window.history.pushState({}, '', pageToPath[page])
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { currentPage, navigate }
}
