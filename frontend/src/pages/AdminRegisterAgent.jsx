import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { lookupUser, registerAgentExisting, registerAgentNew } from '../api/admin'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/PasswordInput'

const PROVIDERS = ['MTN', 'Vodafone', 'AirtelTigo']

const emptyAgentDetails = {
  market_name: '',
  location: '',
  city: '',
  country: 'GH',
  mobile_money_number: '',
  mobile_money_provider: 'MTN',
}

export default function AdminRegisterAgent() {
  const navigate = useNavigate()

  // Step 1: phone lookup
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [foundUser, setFoundUser] = useState(null) // null = not searched, false = searched & not found
  const [searched, setSearched] = useState(false)

  // Step 2: agent details (either path)
  const [agentDetails, setAgentDetails] = useState(emptyAgentDetails)
  const [newAccount, setNewAccount] = useState({ full_name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function updateAgent(field, value) {
    setAgentDetails((prev) => ({ ...prev, [field]: value }))
  }
  function updateNewAccount(field, value) {
    setNewAccount((prev) => ({ ...prev, [field]: value }))
  }

  async function handleLookup(e) {
    e.preventDefault()
    setSearchError('')
    setSearching(true)
    setFoundUser(null)
    setSearched(false)
    try {
      const result = await lookupUser(phone.trim())
      setFoundUser(result)
    } catch (err) {
      if (err.response?.status === 404) {
        setFoundUser(false)
      } else {
        setSearchError(extractErrorMessage(err))
      }
    } finally {
      setSearching(false)
      setSearched(true)
    }
  }

  async function handleRegisterExisting(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      await registerAgentExisting({ user_id: foundUser.id, ...agentDetails })
      navigate('/admin', { replace: true })
    } catch (err) {
      setSubmitError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegisterNew(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      await registerAgentNew({ phone: phone.trim(), ...newAccount, ...agentDetails })
      navigate('/admin', { replace: true })
    } catch (err) {
      setSubmitError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink">&larr; Admin</Link>
      <h1 className="mt-3 text-3xl font-semibold">Register an agent</h1>
      <p className="mt-1 text-muted">Look up by phone first — if they already have an account, you'll just add the agent details.</p>

      <form onSubmit={handleLookup} className="card mt-6 flex gap-2">
        <input
          type="tel"
          required
          className="field-input"
          placeholder="024 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" disabled={searching} className="btn-primary shrink-0">
          {searching ? <Spinner className="border-paper/30 border-t-paper" /> : 'Look up'}
        </button>
      </form>

      {searchError && (
        <p role="alert" className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {searchError}
        </p>
      )}

      {searched && foundUser && foundUser.has_agent_profile && (
        <p className="mt-4 rounded-xl bg-ink/[0.03] px-4 py-3 text-sm text-muted">
          {foundUser.full_name} already has an agent profile.
        </p>
      )}

      {searched && foundUser && !foundUser.has_agent_profile && (
        <>
          <p className="mt-4 rounded-xl bg-teal-pale px-4 py-3 text-sm text-teal">
            Found: <strong>{foundUser.full_name}</strong> &middot; currently a {foundUser.role}
          </p>
          <AgentDetailsForm
            values={agentDetails}
            onChange={updateAgent}
            onSubmit={handleRegisterExisting}
            submitting={submitting}
            error={submitError}
            submitLabel={`Make ${foundUser.full_name} an agent`}
          />
        </>
      )}

      {searched && foundUser === false && (
        <>
          <p className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold-deep">
            No account with this phone number — create one along with their agent profile.
          </p>
          <form onSubmit={handleRegisterNew} className="card mt-4 flex flex-col gap-4">
            <div>
              <label className="field-label" htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                required
                className="field-input"
                value={newAccount.full_name}
                onChange={(e) => updateNewAccount('full_name', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email (optional)</label>
              <input
                id="email"
                type="email"
                className="field-input"
                value={newAccount.email}
                onChange={(e) => updateNewAccount('email', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={newAccount.password}
                onChange={(e) => updateNewAccount('password', e.target.value)}
              />
            </div>

            <AgentFields values={agentDetails} onChange={updateAgent} />

            {submitError && (
              <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
                {submitError}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
              {submitting ? <Spinner className="border-paper/30 border-t-paper" /> : 'Create agent account'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

function AgentDetailsForm({ values, onChange, onSubmit, submitting, error, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="card mt-4 flex flex-col gap-4">
      <AgentFields values={values} onChange={onChange} />

      {error && (
        <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
        {submitting ? <Spinner className="border-paper/30 border-t-paper" /> : submitLabel}
      </button>
    </form>
  )
}

function AgentFields({ values, onChange }) {
  return (
    <>
      <div>
        <label className="field-label" htmlFor="market_name">Market name</label>
        <input
          id="market_name"
          required
          className="field-input"
          placeholder="Makola Market"
          value={values.market_name}
          onChange={(e) => onChange('market_name', e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="location">Location / stall</label>
        <input
          id="location"
          required
          className="field-input"
          placeholder="Row 4, Stall 12"
          value={values.location}
          onChange={(e) => onChange('location', e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="city">City</label>
        <input
          id="city"
          required
          className="field-input"
          placeholder="Accra"
          value={values.city}
          onChange={(e) => onChange('city', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="mobile_money_provider">Provider</label>
          <select
            id="mobile_money_provider"
            className="field-input"
            value={values.mobile_money_provider}
            onChange={(e) => onChange('mobile_money_provider', e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="mobile_money_number">Mobile money number</label>
          <input
            id="mobile_money_number"
            className="field-input"
            placeholder="024 123 4567"
            value={values.mobile_money_number}
            onChange={(e) => onChange('mobile_money_number', e.target.value)}
          />
        </div>
      </div>
    </>
  )
}
