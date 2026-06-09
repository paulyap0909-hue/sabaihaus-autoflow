export const DEMO_EMAIL = 'admin@sabaihaus.com'
export const DEMO_PASSWORD = 'Sabai12345'

const DEMO_SESSION_KEY = 'sabaihaus.demo.session'

interface DemoSession {
  email: string
  loggedInAt: string
}

export function hasDemoSession(): boolean {
  const storedSession = localStorage.getItem(DEMO_SESSION_KEY)

  if (!storedSession) {
    return false
  }

  try {
    const session = JSON.parse(storedSession) as DemoSession
    return session.email === DEMO_EMAIL
  } catch {
    localStorage.removeItem(DEMO_SESSION_KEY)
    return false
  }
}

export function createDemoSession(email: string, password: string): boolean {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return false
  }

  const session: DemoSession = {
    email: DEMO_EMAIL,
    loggedInAt: new Date().toISOString(),
  }

  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
  return true
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY)
}
