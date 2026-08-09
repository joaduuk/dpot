export default function Spinner({ className = '' }) {
  return (
    <div
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
