import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/pots'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(phone, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-muted">Log in to keep your pot on track.</p>

      <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            className="field-input"
            placeholder="024 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
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
