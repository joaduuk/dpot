import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applyAsAgent } from '../api/agents'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'

const PROVIDERS = ['MTN', 'Vodafone', 'AirtelTigo']

export default function AgentApply() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    market_name: '',
    location: '',
    city: '',
    country: 'GH',
    mobile_money_number: '',
    mobile_money_provider: 'MTN',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await applyAsAgent(form)
      navigate('/agent', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-semibold">Become an agent</h1>
      <p className="mt-1 text-muted">
        Collect cash contributions from savers in your market and earn a share of the platform fee.
      </p>

      <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="market_name">Market name</label>
          <input
            id="market_name"
            required
            className="field-input"
            placeholder="Makola Market"
            value={form.market_name}
            onChange={(e) => update('market_name', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="location">Location / stall</label>
          <input
            id="location"
            required
            className="field-input"
            placeholder="Row 4, Stall 12"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="city">City</label>
          <input
            id="city"
            required
            className="field-input"
            placeholder="Accra"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="mobile_money_provider">Mobile money provider</label>
            <select
              id="mobile_money_provider"
              className="field-input"
              value={form.mobile_money_provider}
              onChange={(e) => update('mobile_money_provider', e.target.value)}
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
              value={form.mobile_money_number}
              onChange={(e) => update('mobile_money_number', e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Submit application'}
        </button>

        <p className="text-center text-xs text-muted">
          Your application needs approval before you can start recording payments.
        </p>
      </form>
    </div>
  )
}
