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
