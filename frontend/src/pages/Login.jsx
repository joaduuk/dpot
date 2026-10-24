import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/PasswordInput'
import ResendConfirmation from '../components/ResendConfirmation'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // Set when the password was right but the email hasn't been confirmed yet.
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  const explicitFrom = location.state?.from?.pathname

  function destinationFor(role) {
    if (role === 'agent') return '/agent'
    if (role === 'admin' || role === 'super_admin') return '/admin'
    return '/pots'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setUnverifiedEmail('')
    try {
      const loggedInUser = await login(identifier, password)
      navigate(explicitFrom || destinationFor(loggedInUser.role), { replace: true })
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail?.code === 'email_not_verified') setUnverifiedEmail(detail.email)
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-muted">Log in to keep your pot on track.</p>

      {location.state?.justVerified && (
        <p className="mt-6 rounded-lg bg-teal-pale px-3 py-2 text-sm text-teal">
          Your email is confirmed — log in to get started.
        </p>
      )}
      {location.state?.justReset && (
        <p className="mt-6 rounded-lg bg-teal-pale px-3 py-2 text-sm text-teal">
          Password updated — log in with your new password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="identifier">Phone or email</label>
          <input
            id="identifier"
            required
            autoComplete="username"
            className="field-input"
            placeholder="024 123 4567 or you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="field-label mb-0" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-teal hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Log in'}
        </button>

        {unverifiedEmail && <ResendConfirmation email={unverifiedEmail} />}
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to DailyPot?{' '}
        <Link to="/register" className="font-semibold text-teal hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
