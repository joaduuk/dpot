const STYLES = {
  awaiting_agent: 'bg-clay/15 text-clay',
  pending: 'bg-gold/20 text-gold-deep',
  active: 'bg-teal-pale text-teal',
  completed: 'bg-teal text-white',
  cashed_out: 'bg-ink/10 text-ink',
  suspended: 'bg-clay/15 text-clay',
  disputed: 'bg-clay/15 text-clay',
  cancelled: 'bg-ink/10 text-muted',
  failed: 'bg-clay/15 text-clay',
  default: 'bg-ink/10 text-ink',
}

const LABELS = {
  awaiting_agent: 'Awaiting agent',
  cashed_out: 'Cashed out',
}

export default function StatusPill({ status }) {
  const style = STYLES[status] || STYLES.default
  const label = LABELS[status] || status || 'unknown'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {label}
    </span>
  )
}
