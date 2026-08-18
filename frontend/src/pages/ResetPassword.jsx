import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      navigate('/login', { replace: true, state: { justReset: true } })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold">Invalid reset link</h1>
        <p className="mt-2 text-muted">This link is missing its token — request a new one.</p>
        <Link to="/forgot-password" className="btn-primary mt-6 inline-flex self-center">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      <p className="mt-1 text-muted">This link expires 30 minutes after it was sent.</p>

      <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="new_password">New password</label>
          <PasswordInput
            id="new_password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="confirm_password">Confirm new password</label>
          <PasswordInput
            id="confirm_password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Reset password'}
        </button>
      </form>
    </div>
  )
}
