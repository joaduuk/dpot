import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-muted">Enter the email on your account and we'll send a reset link.</p>

      {sent ? (
        <div className="card mt-8">
          <p className="text-sm">
            If <strong>{email}</strong> is registered, a reset link is on its way. Check your inbox
            (and spam folder) — the link expires in 30 minutes.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="field-input"
              placeholder="ama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
            {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-teal hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
