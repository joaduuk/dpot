import axios from 'axios'

// In dev, Vite proxies /api -> your FastAPI backend (see vite.config.js).
// In prod, set VITE_API_BASE_URL to your deployed backend URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the bearer token (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dailypot_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Centralize 401 handling: drop the stale token and bounce to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dailypot_token')
      localStorage.removeItem('dailypot_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Flattens FastAPI's 422 { detail: [...] } validation errors into one readable string.
export function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail
  if (!detail) return error?.message || 'Something went wrong. Please try again.'
  if (typeof detail === 'string') return detail
  // Structured errors, e.g. { code: 'email_not_verified', message, email } from /auth/login.
  if (detail.message) return detail.message
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(' · ')
  }
  return 'Something went wrong. Please try again.'
}
