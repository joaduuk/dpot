import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">That page doesn't exist, or you don't have access to it.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  )
}
