import { ref } from 'vue'
import axios from 'axios'
import { addNotification } from '@/stores/notifications'
import {
  approveApprovalEventApi,
  getPendingApprovalEventsApi,
  rejectApprovalEventApi,
} from '@/api/admin'

export const approvalEvents = ref([])
export const loadingApprovalEvents = ref(false)
export const approvalLoadError = ref('')

const approvalStorageKey = 'eventora_approval_events_v3'
const societyEventsStorageKey = 'eventora_society_events_v2'
let hasLoadedApprovalEvents = false

const approvalEventDetails = {
  104: {
    submittedBy: 'Siti Noor',
    submittedAt: 'just now',
    displayDate: '15 Jul 2026, 10:00 AM - 4:00 PM',
    venue: 'N28 Computer Lab',
    deadline: '12 Jul 2026, 11:59 PM',
    price: 'Free',
    description:
      'Data Analytics Bootcamp introduces students to spreadsheet cleaning, dashboard planning, and beginner-friendly data storytelling through guided exercises.',
  },
  101: {
    submittedBy: 'Siti Noor',
    submittedAt: '2 hours ago',
    displayDate: '10 Jul 2026, 9:00 AM - 1:00 PM',
    venue: 'N28A Innovation Lab',
    deadline: '8 Jul 2026, 11:59 PM',
    price: 'Free',
    description:
      'This workshop introduces students to sensors, motors, and microcontroller programming. Participants will work in teams to assemble and test a basic autonomous robot.',
  },
  102: {
    submittedBy: 'Aiman',
    submittedAt: '1 day ago',
    displayDate: '15 Jul 2026, 6:00 PM - 9:00 PM',
    venue: 'FAB Seminar Hall',
    deadline: '12 Jul 2026, 11:59 PM',
    price: 'Free',
    description:
      'Students pitch startup ideas to mentors and receive feedback on business models, customer validation, and presentation quality.',
  },
  103: {
    submittedBy: 'Razif',
    submittedAt: '1 day ago',
    displayDate: '18 Jul 2026, 7:30 PM - 10:30 PM',
    venue: 'Student Activity Centre',
    deadline: '15 Jul 2026, 11:59 PM',
    price: 'RM 8.00',
    description:
      'An evening performance featuring student musicians, acoustic sets, and small group performances.',
  },
}

function readSavedApprovalEvents() {
  try {
    const saved = localStorage.getItem(approvalStorageKey)
    return saved ? JSON.parse(saved) : null
  } catch (err) {
    return null
  }
}

function mergeApprovalEvents(seedEvents, savedEvents) {
  if (!Array.isArray(savedEvents)) return seedEvents

  const seedById = new Map(seedEvents.map((event) => [String(event.id), event]))
  const savedIds = new Set(savedEvents.map((event) => String(event.id)))

  const savedWithMockFields = savedEvents.map((event) => ({
    ...(seedById.get(String(event.id)) || {}),
    ...event,
  }))

  const seedOnlyEvents = seedEvents.filter((event) => !savedIds.has(String(event.id)))

  return [...savedWithMockFields, ...seedOnlyEvents]
}

export function saveApprovalEvents() {
  localStorage.setItem(approvalStorageKey, JSON.stringify(approvalEvents.value))
}

export async function loadApprovalEvents() {
  if (hasLoadedApprovalEvents) return

  loadingApprovalEvents.value = true
  approvalLoadError.value = ''

  try {
    if (hasBackendToken()) {
      const response = await getPendingApprovalEventsApi()
      approvalEvents.value = response.data.data.map(formatBackendApprovalEvent)
      hasLoadedApprovalEvents = true
      return
    }

    const response = await axios.get('/mock/approval-events.json')
    const savedEvents = readSavedApprovalEvents()
    approvalEvents.value = mergeApprovalEvents(response.data, savedEvents)
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

  saveApprovalEvents()
}

export async function updateApprovalEvent(id, status, reason = '') {
  if (hasBackendToken()) {
    await updateApprovalEventInBackend(id, status, reason)
    return
  }

  const event = approvalEvents.value.find((item) => String(item.id) === String(id))

  if (event) {
    event.status = status
    event.reason = reason
    saveApprovalEvents()
    updateSocietyEventStatus(id, status, reason)
    addApprovalDecisionNotifications(event, status, reason)
  }
}

async function updateApprovalEventInBackend(id, status, reason = '') {
  if (status === 'approved') {
    await approveApprovalEventApi(id)
  } else if (status === 'rejected') {
    await rejectApprovalEventApi(id, reason)
  }

  const event = approvalEvents.value.find((item) => String(item.id) === String(id))
  if (event) {
    event.status = status
    event.reason = reason
  }
}

function addApprovalDecisionNotifications(event, status, reason = '') {
  if (status === 'approved') {
    addNotification({
      audience: 'organiser',
      type: 'Approval',
      title: 'Event approved',
      message: `${event.title} has been approved and is now visible to students.`,
      badgeClass: 'badge-green',
    })

    addNotification({
      audience: 'faculty_admin',
      type: 'Decision',
      title: 'Event approved successfully',
      message: `${event.title} has been approved. The organiser has been notified.`,
      badgeClass: 'badge-green',
      unread: false,
    })
  }

  if (status === 'rejected') {
    addNotification({
      audience: 'organiser',
      type: 'Revision',
      title: 'Event rejected',
      message: `${event.title} was rejected by Faculty Admin. Reason: ${reason || 'No reason provided.'}`,
      badgeClass: 'badge-red',
    })

    addNotification({
      audience: 'faculty_admin',
      type: 'Decision',
      title: 'Event rejected',
      message: `${event.title} was rejected. The organiser has been notified.`,
      badgeClass: 'badge-red',
      unread: false,
    })
  }
}

function updateSocietyEventStatus(id, approvalStatus, reason = '') {
  const savedEvents = localStorage.getItem(societyEventsStorageKey)
  if (!savedEvents) return

  try {
    const events = JSON.parse(savedEvents)
    if (!Array.isArray(events)) return

    const organiserStatus = {
      approved: 'published',
      rejected: 'rejected',
      pending: 'pending_approval',
    }[approvalStatus]

    if (!organiserStatus) return

    const updatedEvents = events.map((event) =>
      String(event.id) === String(id)
        ? {
            ...event,
            status: organiserStatus,
            rejectionReason: approvalStatus === 'rejected' ? reason : '',
          }
        : event
    )

    localStorage.setItem(societyEventsStorageKey, JSON.stringify(updatedEvents))
  } catch (err) {
    // Ignore invalid localStorage data and keep the approval flow usable.
  }
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
    ...(approvalEventDetails[event.id] || {}),
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
