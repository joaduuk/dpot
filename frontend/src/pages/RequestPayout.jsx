import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { requestPayout } from '../api/payouts'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'

const METHODS = [
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
]

export default function RequestPayout() {
  const { potId } = useParams()
  const navigate = useNavigate()
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState('mobile_money')
  const [accountDetails, setAccountDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const needsAccountDetails = method !== 'cash'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await requestPayout(potId, {
        payout_date: payoutDate,
        method,
        account_details: needsAccountDetails ? accountDetails : undefined,
      })
      navigate(`/pots/${potId}`, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to={`/pots/${potId}`} className="text-sm text-muted hover:text-ink">&larr; Back to pot</Link>
      <h1 className="mt-3 text-3xl font-semibold">Request a payout</h1>
      <p className="mt-1 text-muted">Your pot is fully paid — choose when and how you'd like to be paid out.</p>

      <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="payout_date">Payout date</label>
          <input
            id="payout_date"
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            className="field-input"
            value={payoutDate}
            onChange={(e) => setPayoutDate(e.target.value)}
          />
        </div>

        <div>
          <p className="field-label">Payout method</p>
          <div className="flex flex-col gap-2">
            {METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors
                  ${method === m.value ? 'border-teal bg-teal-pale' : 'border-ink/15 hover:border-ink/30'}`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={(e) => setMethod(e.target.value)}
                  className="h-4 w-4 text-teal focus:ring-teal"
                />
                <span className="font-medium">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {needsAccountDetails && (
          <div>
            <label className="field-label" htmlFor="account_details">
              {method === 'mobile_money' ? 'Mobile money number' : 'Bank account number'}
            </label>
            <input
              id="account_details"
              required
              className="field-input"
              placeholder={method === 'mobile_money' ? '024 123 4567' : 'Account number'}
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
          {submitting ? <Spinner className="border-paper/30 border-t-paper" /> : 'Submit payout request'}
        </button>
      </form>
    </div>
  )
}
