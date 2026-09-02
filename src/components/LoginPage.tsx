import { Eye, EyeOff, Lock, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { login } from '../auth'
import type { Theme } from '../hooks/useTheme'

interface LoginPageProps {
  onSuccess: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function LoginPage({ onSuccess, theme, onToggleTheme }: LoginPageProps) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (login(id, password)) {
      onSuccess()
      return
    }
    setError('Wrong admin ID or password.')
    setShake(true)
    window.setTimeout(() => setShake(false), 400)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={onToggleTheme}
        className="btn-ghost absolute right-4 top-4 sm:right-6 sm:top-6"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      <div
        className={`animate-fade-up glass w-full max-w-md rounded-[1.5rem] p-7 sm:p-8 ${shake ? 'animate-shake' : ''}`}
      >
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Lock size={22} />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-deep">
            Admin access
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            DA Manager
          </h1>
          <p className="mt-2 text-sm text-ink-muted">Sign in to manage laptops and tests.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Admin ID
            </span>
            <input
              autoFocus
              autoComplete="username"
              className="field-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter admin ID"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="field-input pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full justify-center py-3">
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
