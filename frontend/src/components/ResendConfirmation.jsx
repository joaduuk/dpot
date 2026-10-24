import { useEffect, useState } from 'react'
import { resendConfirmation } from '../api/auth'
import { extractErrorMessage } from '../api/client'
import Spinner from './Spinner'

// Matches RESEND_COOLDOWN_SECONDS in backend/app/routers/auth.py.
const COOLDOWN_SECONDS = 60

/** "Resend confirmation email" button with a cooldown, for a known email. */
export default function ResendConfirmation({ email, startCoolingDown = false }) {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(startCoolingDown ? COOLDOWN_SECONDS : 0)

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function handleResend() {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await resendConfirmation(email)
      setNotice('A new confirmation link is on its way.')
      setSecondsLeft(COOLDOWN_SECONDS)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading || secondsLeft > 0}
        className="btn-outline w-full"
      >
        {loading ? (
          <Spinner />
        ) : secondsLeft > 0 ? (
          `Resend email in ${secondsLeft}s`
        ) : (
          'Resend confirmation email'
        )}
      </button>
      {notice && <p className="text-center text-sm text-teal">{notice}</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}
    </div>
  )
}
