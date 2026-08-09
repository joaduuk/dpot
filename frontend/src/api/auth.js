import { apiClient } from './client'

/**
 * POST /auth/register
 * body: { full_name, phone, email, password, country, role }
 */
export function register(payload) {
  return apiClient.post('/auth/register', payload).then((res) => res.data)
}

/**
 * POST /auth/login
 * body: { phone, password }
 * returns: { access_token, token_type, user }
 */
export function login(payload) {
  return apiClient.post('/auth/login', payload).then((res) => res.data)
}
