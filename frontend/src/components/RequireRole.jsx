import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wrap inside ProtectedRoute — assumes the person is already logged in.
 * `role` can be a single role string or an array of allowed roles.
 */
export default function RequireRole({ role, children }) {
  const { user } = useAuth()
  const allowed = Array.isArray(role) ? role : [role]

  if (user && !allowed.includes(user.role)) {
    return <Navigate to="/pots" replace />
  }
  return children
}
