import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPot } from '../api/pots'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'

const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer']

export default function CreatePot() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    daily_amount: '',
    currency: 'GHS',
    payment_method: 'cash',
    start_date: new Date().toISOString().slice(0, 10),
    agent_id: '',
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
      const payload = {
        ...form,
        daily_amount: Number(form.daily_amount),
        agent_id: form.agent_id || undefined,
      }
      const pot = await createPot(payload)
      navigate(`/pots/${pot.id}`, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-semibold">Start a new pot</h1>
      <p className="mt-1 text-muted">Pick a daily amount you can realistically keep up for 30 days.</p>

      <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="name">Pot name</label>
          <input
            id="name"
            required
            className="field-input"
            placeholder="School fees, Rent, Christmas..."
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="daily_amount">Daily amount</label>
            <input
              id="daily_amount"
              type="number"
              min="1"
              step="0.01"
              required
              className="field-input"
              placeholder="5.00"
              value={form.daily_amount}
              onChange={(e) => update('daily_amount', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="currency">Currency</label>
            <input
              id="currency"
              required
              maxLength={3}
              className="field-input uppercase"
              placeholder="GHS"
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="payment_method">Payment method</label>
          <select
            id="payment_method"
            className="field-input capitalize"
            value={form.payment_method}
            onChange={(e) => update('payment_method', e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="start_date">Start date</label>
          <input
            id="start_date"
            type="date"
            required
            className="field-input"
            value={form.start_date}
            onChange={(e) => update('start_date', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="agent_id">Agent ID (optional)</label>
          <input
            id="agent_id"
            className="field-input"
            placeholder="Leave blank if you don't have one"
            value={form.agent_id}
            onChange={(e) => update('agent_id', e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Create pot'}
        </button>
      </form>
    </div>
  )
}
