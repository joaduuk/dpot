import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyAgentProfile, listMySavers, lookupSaverByPhone } from '../api/agents'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import Money from '../components/Money'

export default function AgentDashboard() {
  const [profile, setProfile] = useState(null)
  const [savers, setSavers] = useState(null)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  useEffect(() => {
    Promise.all([getMyAgentProfile(), listMySavers()])
      .then(([profileData, saversData]) => {
        setProfile(profileData)
        setSavers(saversData)
      })
      .catch((err) => setError(extractErrorMessage(err)))
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    setSearchError('')
    setSearchResult(null)
    setSearching(true)
    try {
      const result = await lookupSaverByPhone(phone.trim())
      setSearchResult(result)
    } catch (err) {
      setSearchError(extractErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  if (!profile && !error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      </div>
    )
  }

  const isPending = profile.status === 'pending'

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{profile.market_name}</h1>
          <p className="mt-1 text-muted">
            {profile.location}, {profile.city} &middot; <span className="font-mono">{profile.agent_code}</span>
          </p>
        </div>
        <StatusPill status={profile.status} />
      </div>

      {isPending && (
        <div className="card mt-6 border-gold/40 bg-gold/5">
          <p className="text-sm text-gold-deep">
            Your application is awaiting approval. You'll be able to record payments once an admin approves your account.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="card items-center py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Savers</p>
          <p className="mt-1 text-xl font-semibold font-mono">{profile.total_savers}</p>
        </div>
        <div className="card items-center py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Commission earned</p>
          <p className="mt-1 text-xl font-semibold font-mono">
            <Money amount={profile.total_commission_earned} />
          </p>
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-lg font-semibold">Record a payment</h2>
        <p className="mt-1 text-sm text-muted">
          Search by the saver's phone number — this finds their cash pots, including any not yet claimed.
        </p>
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <input
            type="tel"
            required
            disabled={isPending}
            className="field-input"
            placeholder="024 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="submit" disabled={isPending || searching} className="btn-primary shrink-0">
            {searching ? <Spinner className="border-paper/30 border-t-paper" /> : 'Search'}
          </button>
        </form>

        {searchError && (
          <p role="alert" className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {searchError}
          </p>
        )}

        {searchResult && (
          <div className="mt-4">
            <p className="text-sm font-medium">{searchResult.saver_name}</p>
            {searchResult.pots.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No cash pots found for this saver.</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink/5">
                {searchResult.pots.map((pot) => (
                  <SaverPotRow key={pot.id} pot={pot} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="mb-4 text-lg font-semibold">Your savers</h2>
        {savers && savers.length === 0 && (
          <p className="text-sm text-muted">No savers yet — record a payment to claim your first one.</p>
        )}
        {savers && savers.length > 0 && (
          <ul className="divide-y divide-ink/5">
            {savers.map((pot) => (
              <SaverPotRow key={pot.id} pot={pot} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SaverPotRow({ pot }) {
  return (
    <li className="flex items-center justify-between py-3 text-sm">
      <div>
        <p className="font-medium">{pot.saver_name} &middot; {pot.name}</p>
        <p className="text-muted">
          {pot.days_paid} paid, {pot.buffer_days} buffer &middot; <Money amount={pot.daily_amount} currency={pot.currency} />/day
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill status={pot.status} />
        <Link
          to={`/agent/record`}
          state={{ pot }}
          className="btn-outline px-3 py-1.5 text-xs"
        >
          Record payment
        </Link>
      </div>
    </li>
  )
}
