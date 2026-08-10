import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPots } from '../api/pots'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import Money from '../components/Money'

const DONE_STATUSES = new Set(['completed', 'cashed_out'])

export default function PotsList() {
  const [pots, setPots] = useState(null)
  const [error, setError] = useState('')
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    listPots()
      .then(setPots)
      .catch((err) => setError(extractErrorMessage(err)))
  }, [])

  const activePots = pots?.filter((p) => !DONE_STATUSES.has(p.status)) ?? []
  const donePots = pots?.filter((p) => DONE_STATUSES.has(p.status)) ?? []

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
        <>
          {activePots.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {activePots.map((pot) => (
                <PotCard key={pot.id} pot={pot} />
              ))}
            </div>
          ) : (
            <div className="card mt-8 flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-muted">No active pots right now.</p>
              <Link to="/pots/new" className="btn-primary mt-1">Start a new pot</Link>
            </div>
          )}

          {donePots.length > 0 && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3 text-left transition-colors hover:bg-ink/[0.04]"
              >
                <span className="font-medium">
                  Completed pots <span className="text-muted">({donePots.length})</span>
                </span>
                <span className={`text-muted transition-transform ${showDone ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {showDone && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {donePots.map((pot) => (
                    <PotCard key={pot.id} pot={pot} muted />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PotCard({ pot, muted = false }) {
  return (
    <Link
      to={`/pots/${pot.id}`}
      className={`card flex flex-col gap-3 transition-shadow hover:shadow-lg ${muted ? 'opacity-70' : ''}`}
    >
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
  )
}
