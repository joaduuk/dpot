import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listSaverPots } from '../api/admin'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import Money from '../components/Money'

export default function AdminSaverDetail() {
  const { saverId } = useParams()
  const [pots, setPots] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listSaverPots(saverId)
      .then(setPots)
      .catch((err) => setError(extractErrorMessage(err)))
  }, [saverId])

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink">&larr; Admin</Link>
      <h1 className="mt-3 text-3xl font-semibold">Saver's pots</h1>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      {!pots && !error && (
        <div className="mt-16 flex justify-center">
          <Spinner />
        </div>
      )}

      {pots && pots.length === 0 && (
        <p className="card mt-6 py-8 text-center text-sm text-muted">This saver has no pots yet.</p>
      )}

      {pots && pots.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {pots.map((pot) => (
            <div key={pot.id} className="card flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{pot.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {pot.days_paid} paid, {pot.buffer_days} buffer &middot;{' '}
                  <Money amount={pot.daily_amount} currency={pot.currency} />/day
                </p>
                <p className="mt-1 text-sm">
                  Total collected: <Money amount={pot.total_collected} currency={pot.currency} className="font-semibold" />
                </p>
              </div>
              <StatusPill status={pot.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
