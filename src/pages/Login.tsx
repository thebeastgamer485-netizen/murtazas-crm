import { useState } from 'react'
import { KanbanSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // On success, onAuthStateChange in AuthProvider flips the app to the
        // authenticated view automatically.
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          // Email confirmation is enabled on the project.
          setNotice('Check your email to confirm your account, then sign in.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-primary)]">
            <KanbanSquare size={24} strokeWidth={2.25} className="text-on-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Murtaza's CRM
          </h1>
          <p className="mt-1.5 text-sm text-secondary">
            {mode === 'signin'
              ? 'Sign in to continue'
              : 'Create your account'}
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-[10px] border border-won/30 bg-won-soft px-3 py-2 text-sm text-won-text">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Sign up'}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center text-sm text-secondary">
          {mode === 'signin' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                className="font-semibold text-primary transition-colors hover:text-primary-hover"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setNotice(null)
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-primary transition-colors hover:text-primary-hover"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                  setNotice(null)
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
