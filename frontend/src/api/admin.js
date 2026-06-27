import apiClient from './client'

export function getPendingApprovalEventsApi() {
  return apiClient.get('/admin/events/pending')
}

export function getApprovalEventApi(id) {
  return apiClient.get(`/admin/events/${id}`)
}

export function approveApprovalEventApi(id) {
  return apiClient.post(`/admin/events/${id}/approve`)
}

export function rejectApprovalEventApi(id, reason) {
  return apiClient.post(`/admin/events/${id}/reject`, { reason })
}
