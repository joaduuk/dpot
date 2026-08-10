import { Link } from 'react-router-dom'
import Money from './Money'

const METHOD_LABELS = {
  mobile_money: 'Mobile money',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
}

function methodDetail(payout) {
  if (payout.method === 'mobile_money') return payout.mobile_money_number
  if (payout.method === 'bank_transfer') return payout.bank_account
  return null
}

/**
 * Payout data lives in its own resource (GET /pots/{pot_id}/payout), not on
 * the pot itself — `payout` here is either that response or null (nothing
 * requested yet). Early/partial cashout is allowed any time days_paid > 0,
 * so the request button isn't gated behind the pot being fully paid.
 *
 * States:
 *  1. pot.status === "cashed_out"      -> closed-account summary
 *  2. payout exists, not yet completed -> "requested, awaiting payout" banner
 *  3. no payout yet, days_paid > 0     -> "Request a payout" CTA
 *  4. days_paid === 0                  -> nothing to show
 */
export default function PayoutPanel({ pot, payout }) {
  if (pot.status === 'cashed_out' && payout) {
    return (
      <div className="card mt-6 border-teal/30 bg-teal-pale">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-white">✓</span>
          <h2 className="text-lg font-semibold text-teal">Payout complete — account closed</h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Field label="Amount paid out" value={<Money amount={payout.net_payout} currency={pot.currency} />} />
          <Field label="Method" value={METHOD_LABELS[payout.method] || payout.method} />
          {methodDetail(payout) && <Field label="Account" value={methodDetail(payout)} />}
          <Field
            label="Paid out on"
            value={payout.completed_at ? new Date(payout.completed_at).toLocaleDateString() : '—'}
          />
        </dl>
      </div>
    )
  }

  if (payout && payout.status !== 'completed') {
    return (
      <div className="card mt-6 border-gold/40 bg-gold/5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink">⏳</span>
          <h2 className="text-lg font-semibold text-gold-deep">Payout requested — not yet paid out</h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Field
            label="Requested for"
            value={payout.requested_payout_date ? new Date(payout.requested_payout_date).toLocaleDateString() : '—'}
          />
          <Field label="Method" value={METHOD_LABELS[payout.method] || payout.method} />
          {methodDetail(payout) && <Field label="Account" value={methodDetail(payout)} />}
          <Field label="Days covered" value={payout.days_paid} />
          <Field label="Gross amount" value={<Money amount={payout.gross_amount} currency={pot.currency} />} />
          <Field label="Platform fee" value={<Money amount={payout.platform_fee} currency={pot.currency} />} />
          {payout.agent_commission > 0 && (
            <Field label="Agent commission" value={<Money amount={payout.agent_commission} currency={pot.currency} />} />
          )}
          <Field label="You'll receive" value={<Money amount={payout.net_payout} currency={pot.currency} className="font-semibold" />} />
        </dl>
      </div>
    )
  }

  if (!payout && pot.days_paid > 0 && pot.status !== 'cashed_out') {
    const isFull = pot.status === 'completed'
    return (
      <div className="card mt-6 flex flex-col items-center gap-3 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-white text-lg">
          {isFull ? '✓' : '💰'}
        </span>
        <h2 className="text-lg font-semibold">{isFull ? 'Pot fully paid!' : 'Need your money early?'}</h2>
        <p className="text-sm text-muted">
          {isFull
            ? "Choose when and how you'd like to be paid out."
            : `You've paid ${pot.days_paid} day${pot.days_paid > 1 ? 's' : ''} so far — you can cash out early any time, no need to wait for the full 30.`}
        </p>
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
