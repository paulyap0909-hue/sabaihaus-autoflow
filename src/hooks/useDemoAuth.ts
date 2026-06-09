import { useCallback, useEffect, useState } from 'react'
import {
  clearDemoSession,
  createDemoSession,
  hasDemoSession,
} from '../services/auth/demoAuth'

const LOGIN_PATH = '/login'
const DASHBOARD_PATH = '/dashboard'

function replacePath(path: string) {
  window.history.replaceState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useDemoAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasDemoSession)
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const enforceRouteAccess = () => {
      const authenticated = hasDemoSession()
      const currentPath = window.location.pathname

      setIsAuthenticated(authenticated)

      if (!authenticated && currentPath !== LOGIN_PATH) {
        replacePath(LOGIN_PATH)
        return
      }

      if (authenticated && currentPath === LOGIN_PATH) {
        replacePath(DASHBOARD_PATH)
        return
      }

      setPathname(currentPath)
    }

    window.addEventListener('popstate', enforceRouteAccess)
    enforceRouteAccess()

    return () => window.removeEventListener('popstate', enforceRouteAccess)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const succeeded = createDemoSession(email, password)

    if (succeeded) {
      setIsAuthenticated(true)
      setPathname(DASHBOARD_PATH)
      replacePath(DASHBOARD_PATH)
    }

    return succeeded
  }, [])

  const logout = useCallback(() => {
    clearDemoSession()
    setIsAuthenticated(false)
    setPathname(LOGIN_PATH)
    replacePath(LOGIN_PATH)
  }, [])

  return {
    isAuthenticated,
    pathname,
    login,
    logout,
  }
}
