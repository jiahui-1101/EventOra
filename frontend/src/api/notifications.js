import apiClient from './client'

export function getNotificationsApi() {
  return apiClient.get('/notifications')
}

export function markNotificationReadApi(id) {
  return apiClient.post(`/notifications/${id}/read`)
}

export function markAllNotificationsReadApi() {
  return apiClient.post('/notifications/read-all')
}
