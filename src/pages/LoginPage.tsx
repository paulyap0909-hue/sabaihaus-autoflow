import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../services/auth/demoAuth'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!onLogin(email, password)) {
      setError('The email or password is incorrect. Please use the demo credentials below.')
    }
  }

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Sabai Haus introduction">
        <div className="login-brand">
          <span className="login-brand-mark">
            <Leaf size={22} strokeWidth={1.7} />
          </span>
          <span>
            <strong>Sabai Haus</strong>
            <small>AutoFlow Wellness OS</small>
          </span>
        </div>

        <div className="login-story-copy">
          <span className="login-eyebrow">
            <Sparkles size={14} />
            Calm operations. Exceptional care.
          </span>
          <h1>Your wellness business, beautifully in flow.</h1>
          <p>
            All-in-one wellness operating system for appointments, clients,
            packages, inventory and staff commissions.
          </p>
        </div>

        <div className="login-story-footer">
          <span className="login-trust-icon">
            <ShieldCheck size={17} />
          </span>
          <span>
            <strong>Private workspace</strong>
            <small>Designed for the Sabai Haus team</small>
          </span>
        </div>

        <span className="login-orbit login-orbit-one" aria-hidden="true" />
        <span className="login-orbit login-orbit-two" aria-hidden="true" />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <span className="login-brand-mark">
              <Leaf size={20} strokeWidth={1.7} />
            </span>
            <span>
              <strong>Sabai Haus</strong>
              <small>AutoFlow Wellness OS</small>
            </span>
          </div>

          <header className="login-card-header">
            <span>Welcome back</span>
            <h2>Sign in to your workspace</h2>
            <p>Continue to today&apos;s appointments, clients and team overview.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Email address</span>
              <div>
                <Mail size={17} strokeWidth={1.8} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@sabaihaus.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="login-field">
              <span>Password</span>
              <div>
                <LockKeyhole size={17} strokeWidth={1.8} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="login-submit" type="submit">
              Sign in to AutoFlow
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="demo-credentials">
            <div>
              <span>Demo workspace</span>
              <button type="button" onClick={fillDemoCredentials}>
                Use credentials
              </button>
            </div>
            <p>
              <span>Email</span>
              <code>{DEMO_EMAIL}</code>
            </p>
            <p>
              <span>Password</span>
              <code>{DEMO_PASSWORD}</code>
            </p>
          </div>

          <p className="login-footnote">
            Temporary demo access for Phase 4.4. Supabase authentication will be
            added in a future phase.
          </p>
        </div>
      </section>
    </main>
  )
}
