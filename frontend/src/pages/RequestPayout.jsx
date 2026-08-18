import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPot, getPotBoard } from '../api/pots'
import { requestPayout } from '../api/payouts'
import { extractErrorMessage } from '../api/client'
import { normalizeBoard } from '../components/PotBoard'
import Spinner from '../components/Spinner'
import Money from '../components/Money'

const METHODS = [
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
]

export default function RequestPayout() {
  const { potId } = useParams()
  const navigate = useNavigate()
  const [pot, setPot] = useState(null)
  const [confirmedDays, setConfirmedDays] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState('mobile_money')
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getPot(potId), getPotBoard(potId)])
      .then(([potData, boardData]) => {
        setPot(potData)
        // Count every confirmed day 1-31, exactly like the backend does —
        // NOT pot.days_paid, which deliberately excludes day 31 so the
        // 30-day progress bar never goes over 100%. Using days_paid here
        // would understate the preview whenever day 31 has been paid.
        const days = normalizeBoard(boardData, potData)
        setConfirmedDays(days.filter((d) => d.status === 'paid').length)
      })
      .catch((err) => setLoadError(extractErrorMessage(err)))
  }, [potId])

  const grossAmount = pot && confirmedDays != null ? confirmedDays * pot.daily_amount : 0
  const platformFee = pot ? pot.daily_amount : 0
  const netPayout = grossAmount - platformFee

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await requestPayout(potId, {
        method,
        mobile_money_number: method === 'mobile_money' ? mobileMoneyNumber : undefined,
        bank_account: method === 'bank_transfer' ? bankAccount : undefined,
        requested_payout_date: payoutDate,
      })
      navigate(`/pots/${potId}`, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!pot && !loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{loadError}</p>
        <Link to={`/pots/${potId}`} className="btn-outline mt-4 inline-flex">Back to pot</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to={`/pots/${potId}`} className="text-sm text-muted hover:text-ink">&larr; Back to pot</Link>
      <h1 className="mt-3 text-3xl font-semibold">Request a payout</h1>
      <p className="mt-1 text-muted">
        {confirmedDays} day{confirmedDays !== 1 ? 's' : ''} paid — choose when and how you'd like to be paid out.
        You don't need to wait until the full 30 days are done.
      </p>

      <div className="card mt-6 grid grid-cols-2 gap-4 text-sm">
        <Row label="Days covered" value={confirmedDays} />
        <Row label="Gross amount" value={<Money amount={grossAmount} currency={pot.currency} />} />
        <Row label="Platform fee" value={<Money amount={platformFee} currency={pot.currency} />} />
        <Row label="You'll receive" value={<Money amount={netPayout} currency={pot.currency} className="font-semibold" />} />
      </div>

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
          <p className="mt-1.5 text-xs text-muted">
            Pick today, or any date in the future — whenever suits you.
          </p>
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

        {method === 'mobile_money' && (
          <div>
            <label className="field-label" htmlFor="mobile_money_number">Mobile money number</label>
            <input
              id="mobile_money_number"
              required
              className="field-input"
              placeholder="024 123 4567"
              value={mobileMoneyNumber}
              onChange={(e) => setMobileMoneyNumber(e.target.value)}
            />
          </div>
        )}

        {method === 'bank_transfer' && (
          <div>
            <label className="field-label" htmlFor="bank_account">Bank account number</label>
            <input
              id="bank_account"
              required
              className="field-input"
              placeholder="Account number"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
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

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-mono font-medium">{value}</p>
    </div>
  )
}
