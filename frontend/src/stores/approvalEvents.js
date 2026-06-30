import { ref } from 'vue'
import {
  approveApprovalEventApi,
  getPendingApprovalEventsApi,
  rejectApprovalEventApi,
} from '@/api/admin'

export const approvalEvents = ref([])
export const loadingApprovalEvents = ref(false)
export const approvalLoadError = ref('')

let hasLoadedApprovalEvents = false

export function saveApprovalEvents() {
  // Approval events are persisted by the backend. This function remains for older imports.
}

export async function loadApprovalEvents() {
  if (hasLoadedApprovalEvents && hasBackendToken()) return

  loadingApprovalEvents.value = true
  approvalLoadError.value = ''

  try {
    if (!hasBackendToken()) {
      approvalEvents.value = []
      approvalLoadError.value = 'Please sign in with a Faculty Admin account to load approvals.'
      hasLoadedApprovalEvents = true
      return
    }

    const response = await getPendingApprovalEventsApi()
    approvalEvents.value = response.data.data.map(formatBackendApprovalEvent)
    hasLoadedApprovalEvents = true
  } catch (err) {
    approvalLoadError.value = 'Failed to load approval events. Please try again later.'
  } finally {
    loadingApprovalEvents.value = false
  }
}

export function addApprovalEvent(newEvent) {
  const existingIndex = approvalEvents.value.findIndex(
    (event) => String(event.id) === String(newEvent.id)
  )

  if (existingIndex >= 0) {
    approvalEvents.value.splice(existingIndex, 1, {
      ...approvalEvents.value[existingIndex],
      ...newEvent,
      status: 'pending',
      reason: '',
    })
  } else {
    approvalEvents.value.unshift({
      ...newEvent,
      status: 'pending',
      reason: '',
    })
  }
}

export async function updateApprovalEvent(id, status, reason = '') {
  if (hasBackendToken()) {
    await updateApprovalEventInBackend(id, status, reason)
    return
  }

  throw new Error('Please sign in with a Faculty Admin account to update approvals.')
}

async function updateApprovalEventInBackend(id, status, reason = '') {
  if (status === 'approved') {
    await approveApprovalEventApi(id)
  } else if (status === 'rejected') {
    await rejectApprovalEventApi(id, reason)
  }

  await refreshBackendApprovalEvents()
}

async function refreshBackendApprovalEvents() {
  const response = await getPendingApprovalEventsApi()
  approvalEvents.value = response.data.data.map(formatBackendApprovalEvent)
}

export function getApprovalEventDetails(event) {
  return {
    submittedBy: 'Organiser',
    submittedAt: 'recently',
    displayDate: event.date,
    venue: 'TBC',
    deadline: 'TBC',
    price: 'Free',
    image: '',
    description:
      'Event description preview. Admin can open full details to review the complete submission.',
    ...(event.details || {}),
  }
}

function hasBackendToken() {
  return Boolean(localStorage.getItem('eventora_token'))
}

function formatBackendApprovalEvent(event) {
  const start = event.start_datetime ? new Date(event.start_datetime) : null
  const end = event.end_datetime ? new Date(event.end_datetime) : null
  const price = event.fee_type === 'paid'
    ? `RM ${Number(event.fee_amount || 0).toFixed(2)}`
    : 'Free'

  return {
    id: event.id,
    society: event.society_name,
    title: event.title,
    date: start ? formatDateOnly(start) : 'Date not set',
    category: toTitleCase(event.category),
    capacity: Number(event.capacity || 0),
    status: event.status === 'pending_approval' ? 'pending' : event.status,
    reason: '',
    details: {
      submittedBy: event.society_name,
      submittedAt: event.submitted_at ? formatRelativeTime(event.submitted_at) : 'recently',
      displayDate: formatDateRange(start, end),
      venue: event.venue || 'TBC',
      deadline: 'TBC',
      price,
      description: event.description || 'No description provided.',
    },
  }
}

function formatDateRange(start, end) {
  if (!start) return 'Date not set'
  const startDate = formatDateOnly(start)
  const startTime = formatTimeOnly(start)
  const endTime = end ? formatTimeOnly(end) : '--'
  return `${startDate}, ${startTime} - ${endTime}`
}

function formatDateOnly(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeOnly(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'recently'

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function toTitleCase(value) {
  const text = String(value || 'academic')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
