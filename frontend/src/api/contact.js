import { apiClient } from './client'

/**
 * POST /contact-message
 * body: { name, email, subject, message, website }  (website = honeypot, leave empty)
 */
export function sendContactMessage(payload) {
  return apiClient.post('/contact-message', payload).then((res) => res.data)
}
