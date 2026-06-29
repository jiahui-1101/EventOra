import axios from 'axios'

const dashboardClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

dashboardClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getOrganiserDashboardApi() {
  return dashboardClient.get('/dashboard/organiser')
}

export function getOrganiserEventsApi() {
  return dashboardClient.get('/events/mine')
}

export function getOrganiserParticipantsApi() {
  return dashboardClient.get('/dashboard/organiser/participants')
}

export function getOrganiserAttendanceApi() {
  return dashboardClient.get('/dashboard/organiser/attendance')
}

export function getFacultyDashboardApi() {
  return dashboardClient.get('/dashboard/faculty')
}

export function getOrganiserFeedbackApi() {
  return dashboardClient.get('/dashboard/organiser/feedback')
}
