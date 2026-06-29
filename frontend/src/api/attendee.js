import apiClient from './client'

export function getCompletedEventsApi() {
  return apiClient.get('/me/completed-events')
}

export function submitFeedbackApi(eventId, payload) {
  return apiClient.post(`/events/${eventId}/feedback`, payload)
}

export function issueCertificateApi(eventId) {
  return apiClient.post(`/events/${eventId}/certificate`)
}
