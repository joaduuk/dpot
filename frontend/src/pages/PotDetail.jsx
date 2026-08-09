import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPot, getPotBoard } from '../api/pots'
import { listPotPayments, allocateBufferDay } from '../api/payments'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import Money from '../components/Money'
import PotBoard from '../components/PotBoard'
import PayoutPanel from '../components/PayoutPanel'
import { dateForDay, formatShort } from '../utils/dates'

export default function PotDetail() {
  const { potId } = useParams()
  const [pot, setPot] = useState(null)
  const [board, setBoard] = useState(null)
  const [payments, setPayments] = useState(null)
  const [error, setError] = useState('')
  const [allocating, setAllocating] = useState(false)

  const loadAll = useCallback(async () => {
    setError('')
    try {
      const [potData, boardData, paymentsData] = await Promise.all([
        getPot(potId),
        getPotBoard(potId),
        listPotPayments(potId),
      ])
      setPot(potData)
      setBoard(boardData)
      setPayments(paymentsData)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }, [potId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const bufferCount = pot?.buffer_days ?? 0
  const isActive = pot?.status === 'active'
  const hasBufferDays = isActive && bufferCount > 0

  async function handleAllocate(dayNumber) {
    setAllocating(true)
    setError('')
    try {
      await allocateBufferDay({ pot_id: potId, day_number: dayNumber })
      await loadAll()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setAllocating(false)
    }
  }

  if (!pot && !error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error && !pot) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
        <Link to="/pots" className="btn-outline mt-4 inline-flex">Back to pots</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/pots" className="text-sm text-muted hover:text-ink">&larr; My pots</Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{pot.name}</h1>
          <p className="mt-1 text-muted">
            <Money amount={pot.daily_amount} currency={pot.currency} /> / day &middot; started{' '}
            {formatShort(dateForDay(pot.start_date, 1))}
          </p>
        </div>
        <StatusPill status={pot.status} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Total saved" value={<Money amount={pot.total_collected} currency={pot.currency} />} />
        <Stat label="Days paid" value={`${pot.days_paid} / 30`} />
        <Stat label="Buffer days" value={pot.buffer_days} />
      </div>

      {isActive && (
        <div className="mt-6">
          <Link to={`/pots/${potId}/pay`} className="btn-primary w-full sm:w-auto">
            Make a payment
          </Link>
        </div>
      )}

      <PayoutPanel pot={pot} />

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      <div className="card mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your board</h2>
          {allocating && <Spinner />}
        </div>
        <PotBoard board={board} pot={pot} onAllocate={handleAllocate} allocatable={hasBufferDays} busy={allocating} />
      </div>

      <div className="card mt-6">
        <h2 className="mb-4 text-lg font-semibold">Payment history</h2>
        {payments && payments.length === 0 && (
          <p className="text-sm text-muted">No payments recorded yet.</p>
        )}
        {payments && payments.length > 0 && (
          <ul className="divide-y divide-ink/5">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {p.days_covered} day{p.days_covered !== 1 ? 's' : ''} &middot; {p.method}
                  </p>
                  <p className="text-muted">{new Date(p.recorded_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Money amount={p.amount} currency={pot.currency} className="font-semibold" />
                  <StatusPill status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card items-center py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold font-mono">{value}</p>
    </div>
  )
}
