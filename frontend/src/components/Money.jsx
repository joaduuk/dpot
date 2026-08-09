export default function Money({ amount = 0, currency = '', className = '' }) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {currency ? `${currency} ` : ''}
      {formatted}
    </span>
  )
}
