const STYLES = {
  pending: 'bg-gold/20 text-gold-deep',
  active: 'bg-teal-pale text-teal',
  completed: 'bg-teal text-white',
  cancelled: 'bg-ink/10 text-muted',
  failed: 'bg-clay/15 text-clay',
  default: 'bg-ink/10 text-ink',
}

export default function StatusPill({ status }) {
  const style = STYLES[status] || STYLES.default
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {status || 'unknown'}
    </span>
  )
}
