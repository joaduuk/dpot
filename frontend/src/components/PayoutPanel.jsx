import { Link } from 'react-router-dom'
import Money from './Money'

const METHOD_LABELS = {
  mobile_money: 'Mobile money',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
}

/**
 * Three states, driven by fields already on the pot (from GET /pots/{pot_id}):
 *  1. status === "completed" && no payout_requested_at  -> "Request a payout" CTA
 *  2. status === "completed" && payout_requested_at set -> "requested, not yet paid" banner
 *  3. status === "cashed_out"                            -> closed-account summary
 */
export default function PayoutPanel({ pot }) {
  if (pot.status === 'cashed_out') {
    return (
      <div className="card mt-6 border-teal/30 bg-teal-pale">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-white">✓</span>
          <h2 className="text-lg font-semibold text-teal">Payout complete — account closed</h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Field label="Amount paid out" value={<Money amount={pot.total_collected} currency={pot.currency} />} />
          <Field label="Method" value={METHOD_LABELS[pot.payout_method] || pot.payout_method} />
          {pot.payout_account_details && (
            <Field label="Account" value={pot.payout_account_details} />
          )}
          <Field
            label="Paid out on"
            value={pot.cashed_out_at ? new Date(pot.cashed_out_at).toLocaleDateString() : '—'}
          />
        </dl>
      </div>
    )
  }

  if (pot.status === 'completed' && pot.payout_requested_at) {
    return (
      <div className="card mt-6 border-gold/40 bg-gold/5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink">⏳</span>
          <h2 className="text-lg font-semibold text-gold-deep">Completed — payout requested, not yet paid out</h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Field
            label="Requested for"
            value={pot.requested_payout_date ? new Date(pot.requested_payout_date).toLocaleDateString() : '—'}
          />
          <Field label="Method" value={METHOD_LABELS[pot.payout_method] || pot.payout_method} />
          {pot.payout_account_details && (
            <Field label="Account" value={pot.payout_account_details} />
          )}
        </dl>
      </div>
    )
  }

  if (pot.status === 'completed') {
    return (
      <div className="card mt-6 flex flex-col items-center gap-3 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-white text-lg">✓</span>
        <h2 className="text-lg font-semibold">Pot fully paid!</h2>
        <p className="text-sm text-muted">Choose when and how you'd like to be paid out.</p>
        <Link to={`/pots/${pot.id}/payout`} className="btn-gold mt-1">Request a payout</Link>
      </div>
    )
  }

  return null
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}
