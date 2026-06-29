import apiClient from './client'

export function getMySocietiesApi() {
  return apiClient.get('/societies/mine')
}

export function getMyEventApi(id) {
  return apiClient.get(`/events/${id}`)
}

export function createEventApi(payload) {
  return apiClient.post('/events', payload)
}

export function createDraftEventApi(payload) {
  return apiClient.post('/events/draft', payload)
}

export function updateEventApi(id, payload) {
  return apiClient.put(`/events/${id}`, payload)
}

export function updateDraftEventApi(id, payload) {
  return apiClient.put(`/events/${id}/draft`, payload)
}

export function uploadEventPosterApi(id, posterFile) {
  const formData = new FormData()
  formData.append('poster', posterFile)

  return apiClient.post(`/events/${id}/poster`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getPublicEventApi(id) {
  return apiClient.get(`/public/events/${id}`)
}

export function getFavoritesApi() {
  return apiClient.get('/favorites')
}

export function addFavoriteApi(id) {
  return apiClient.post(`/favorites/${id}`)
}

export function removeFavoriteApi(id) {
  return apiClient.delete(`/favorites/${id}`)
}

export function getFavoriteStatusApi(id) {
  return apiClient.get(`/favorites/${id}/status`)
}

export function getOrganiserFeedbackApi(id) {
  return apiClient.get(`/events/${id}/feedback`)
}

export function exportAttendanceCsvApi(id) {
  return apiClient.get(`/events/${id}/attendance/export`, {
    responseType: 'blob',
  })
}

export function completeEventApi(id) {
  return apiClient.patch(`/events/${id}/complete`)
}

export function getOrganiserAttendanceApi(id) {
  return apiClient.get(`/events/${id}/attendance`)
}