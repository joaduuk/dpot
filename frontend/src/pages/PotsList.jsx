import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPots } from '../api/pots'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import Money from '../components/Money'

export default function PotsList() {
  const [pots, setPots] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listPots()
      .then(setPots)
      .catch((err) => setError(extractErrorMessage(err)))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My pots</h1>
          <p className="mt-1 text-muted">Every pot you're filling, at a glance.</p>
        </div>
        <Link to="/pots/new" className="btn-gold">New pot</Link>
      </div>

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
        <div className="card mt-8 flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-xl">●</span>
          <h2 className="text-xl font-semibold">No pots yet</h2>
          <p className="max-w-sm text-muted">
            Start one and pick a daily amount you can keep up — the board fills in one bead a day.
          </p>
          <Link to="/pots/new" className="btn-primary mt-2">Start a pot</Link>
        </div>
      )}

      {pots && pots.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {pots.map((pot) => (
            <Link key={pot.id} to={`/pots/${pot.id}`} className="card flex flex-col gap-3 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold">{pot.name}</h2>
                <StatusPill status={pot.status} />
              </div>

              <div className="flex items-baseline gap-1">
                <Money amount={pot.total_collected} currency={pot.currency} className="text-2xl font-semibold" />
                <span className="text-sm text-muted">saved</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-teal transition-all"
                  style={{ width: `${Math.min(100, pot.progress_percent || 0)}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-muted">
                <span>{pot.days_paid} days paid</span>
                <span><Money amount={pot.daily_amount} currency={pot.currency} />/day</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
