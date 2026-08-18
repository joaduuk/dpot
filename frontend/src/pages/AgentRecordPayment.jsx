import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { recordPayment } from '../api/payments'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import Money from '../components/Money'

export default function AgentRecordPayment() {
  const location = useLocation()
  const navigate = useNavigate()
  const pot = location.state?.pot

  const [daysToPay, setDaysToPay] = useState(1)
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!pot) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-muted">No pot selected — go back and search for the saver again.</p>
        <Link to="/agent" className="btn-outline mt-4 inline-flex">Back to dashboard</Link>
      </div>
    )
  }

  // Same 31-slot logic as the saver-facing payment screen — day 31 (the
  // fee day) counts as a normal payable slot here too.
  const remainingDays = 31 - (pot.days_paid + pot.buffer_days)
  const estimatedAmount = Number(daysToPay) * pot.daily_amount

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await recordPayment({
        pot_id: pot.id,
        days_to_pay: Number(daysToPay),
        method: 'cash',
        reference: reference || undefined,
        use_wallet_credit: false,
      })
      navigate('/agent', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to="/agent" className="text-sm text-muted hover:text-ink">&larr; Dashboard</Link>
      <h1 className="mt-3 text-3xl font-semibold">Record cash payment</h1>
      <p className="mt-1 text-muted">{pot.saver_name} &middot; {pot.name}</p>

      <div className="card mt-6 grid grid-cols-2 gap-4 text-sm">
        <Row label="Days paid" value={pot.days_paid} />
        <Row label="Buffer days" value={pot.buffer_days} />
        <Row label="Remaining slots" value={remainingDays} />
        <Row label="Daily amount" value={<Money amount={pot.daily_amount} currency={pot.currency} />} />
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="days_to_pay">Days being paid for</label>
          <input
            id="days_to_pay"
            type="number"
            min={1}
            max={remainingDays || undefined}
            required
            className="field-input"
            value={daysToPay}
            onChange={(e) => setDaysToPay(e.target.value)}
          />
        </div>

        <div className="flex items-baseline justify-between rounded-xl bg-teal-pale px-4 py-3">
          <span className="text-sm font-medium text-teal">Amount collected</span>
          <Money amount={estimatedAmount} currency={pot.currency} className="text-lg font-semibold text-teal" />
        </div>

        <div>
          <label className="field-label" htmlFor="reference">Reference (optional)</label>
          <input
            id="reference"
            className="field-input"
            placeholder="Receipt number or note"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || remainingDays <= 0} className="btn-primary mt-1 w-full">
          {submitting ? <Spinner className="border-paper/30 border-t-paper" /> : 'Record payment'}
        </button>
      </form>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-mono font-medium">{value}</p>
    </div>
  )
}
