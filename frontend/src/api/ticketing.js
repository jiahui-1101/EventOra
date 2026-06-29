import apiClient from './client'

export async function fetchTicketingSeed() {
  const [eventsResponse, registrationsResponse, ticketsResponse] = await Promise.allSettled([
    apiClient.get('/events'),
    apiClient.get('/me/registrations'),
    apiClient.get('/me/tickets'),
  ])

  return {
    events: eventsResponse.status === 'fulfilled' ? eventsResponse.value.data.data : [],
    registrations: registrationsResponse.status === 'fulfilled' ? registrationsResponse.value.data.data : [],
    tickets: ticketsResponse.status === 'fulfilled' ? ticketsResponse.value.data.data.all || [] : [],
  }
}

export function registerForEventApi(eventId) {
  return apiClient.post(`/events/${eventId}/registrations`)
}

export function confirmRegistrationPaymentApi(registrationId) {
  return apiClient.post(`/registrations/${registrationId}/payment`)
}

export function getMyRegistrationsApi() {
  return apiClient.get('/me/registrations')
}

export function cancelRegistrationApi(registrationId) {
  return apiClient.delete(`/registrations/${registrationId}`)
}

export function getMyTicketsApi() {
  return apiClient.get('/me/tickets')
}

export function cancelTicketApi(ticketId) {
  return apiClient.patch(`/tickets/${ticketId}/cancel`)
}

export function getCheckInTicketsApi(eventId) {
  return apiClient.get(`/events/${eventId}/check-in/tickets`)
}

export function checkInTicketApi({ eventId, code, method = 'manual_entry' }) {
  return apiClient.post('/check-ins', {
    event_id: eventId,
    code,
    method,
  })
}
