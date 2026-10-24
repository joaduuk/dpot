import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmEmail, resendConfirmation } from '../api/auth'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState(token ? 'confirming' : 'error')
  const [error, setError] = useState(token ? '' : 'This link is missing its token.')
  const requested = useRef(false)

  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState('')

  useEffect(() => {
    // StrictMode runs effects twice in dev; only send the token once.
    if (!token || requested.current) return
    requested.current = true
    confirmEmail(token)
      .then(() => setStatus('confirmed'))
      .catch((err) => {
        setError(extractErrorMessage(err))
        setStatus('error')
      })
  }, [token])

  async function handleResend(e) {
    e.preventDefault()
    setResendError('')
    setResending(true)
    try {
      await resendConfirmation(email.trim())
      setResent(true)
    } catch (err) {
      setResendError(extractErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  if (status === 'confirming') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Spinner />
        <p className="text-muted">Confirming your email…</p>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold">Email confirmed</h1>
        <p className="mt-2 text-muted">Your account is ready. Log in to start your first pot.</p>
        <Link to="/login" state={{ justVerified: true }} className="btn-primary mt-6 inline-flex self-center">
          Log in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Link not valid</h1>
      <p className="mt-1 text-muted">
        {error} Confirmation links expire after 48 hours. Enter your email and we'll send a new one.
      </p>

      {resent ? (
        <div className="card mt-8">
          <p className="text-sm">
            If <strong>{email}</strong> is waiting for confirmation, a new link is on its way. Check
            your inbox (and spam folder).
          </p>
        </div>
      ) : (
        <form onSubmit={handleResend} className="card mt-8 flex flex-col gap-4">
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

          {resendError && (
            <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
              {resendError}
            </p>
          )}

          <button type="submit" disabled={resending} className="btn-primary mt-1 w-full">
            {resending ? <Spinner className="border-paper/30 border-t-paper" /> : 'Send a new link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Already confirmed?{' '}
        <Link to="/login" className="font-semibold text-teal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
