import {
  getNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '@/api/notifications'

const notificationStorageKey = 'eventora_notifications'

function readSavedNotifications() {
  try {
    const saved = localStorage.getItem(notificationStorageKey)
    return saved ? JSON.parse(saved) : null
  } catch (err) {
    return null
  }
}

function mergeNotifications(seedNotifications, savedNotifications) {
  if (!Array.isArray(savedNotifications)) return seedNotifications

  const seedIds = new Set(seedNotifications.map((notification) => String(notification.id)))
  const savedById = new Map(
    savedNotifications.map((notification) => [String(notification.id), notification])
  )

  const customNotifications = savedNotifications.filter(
    (notification) => !seedIds.has(String(notification.id))
  )

  const mergedSeedNotifications = seedNotifications.map((notification) => ({
    ...notification,
    ...(savedById.get(String(notification.id)) || {}),
  }))

  return [...customNotifications, ...mergedSeedNotifications]
}

export async function loadNotifications() {
  const savedNotifications = readSavedNotifications()

  try {
    if (hasBackendToken()) {
      const response = await getNotificationsApi()
      return response.data.data.map(formatBackendNotification)
    }

    const response = await fetch('/mock/notifications.json')

    if (!response.ok) {
      return Array.isArray(savedNotifications) ? savedNotifications : []
    }

    const seedNotifications = await response.json()
    return mergeNotifications(seedNotifications, savedNotifications)
  } catch (err) {
    return Array.isArray(savedNotifications) ? savedNotifications : []
  }
}

export function saveNotifications(notifications) {
  localStorage.setItem(notificationStorageKey, JSON.stringify(notifications))
}

export function addNotification(notification) {
  const savedNotifications = readSavedNotifications()
  const notifications = Array.isArray(savedNotifications) ? savedNotifications : []

  const newNotification = {
    id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: 'Just now',
    unread: true,
    badgeClass: 'badge-blue',
    ...notification,
  }

  saveNotifications([newNotification, ...notifications])
  return newNotification
}

export async function markNotificationAsRead(id) {
  if (hasBackendToken()) {
    await markNotificationReadApi(id)
  }
}

export async function markAllNotificationsAsRead() {
  if (hasBackendToken()) {
    await markAllNotificationsReadApi()
  }
}

export function usingBackendNotifications() {
  return hasBackendToken()
}

function hasBackendToken() {
  return Boolean(localStorage.getItem('eventora_token'))
}

function formatBackendNotification(notification) {
  const type = notification.type || 'notification'

  return {
    id: notification.id,
    audience: getCurrentRole(),
    type: formatTypeLabel(type),
    title: notification.title,
    message: notification.message,
    relatedEventId: notification.related_event_id,
    unread: !Boolean(Number(notification.is_read)),
    badgeClass: badgeClassForType(type),
    time: formatRelativeTime(notification.created_at),
    createdAt: notification.created_at,
  }
}

function getCurrentRole() {
  try {
    const user = JSON.parse(localStorage.getItem('eventora_user') || 'null')
    const legacySession = JSON.parse(localStorage.getItem('eventora_session') || 'null')

    return user?.role || legacySession?.user?.role || localStorage.getItem('userRole') || 'attendee'
  } catch (error) {
    return localStorage.getItem('userRole') || 'attendee'
  }
}

function formatTypeLabel(type) {
  const labels = {
    event_pending_approval: 'Approval',
    event_approved: 'Approval',
    event_rejected: 'Revision',
    event_cancelled: 'Cancellation',
    event_reminder: 'Reminder',
    test: 'Test',
  }

  return labels[type] || type.replaceAll('_', ' ')
}

function badgeClassForType(type) {
  if (type.includes('approved')) return 'badge-green'
  if (type.includes('rejected') || type.includes('cancelled')) return 'badge-red'
  if (type.includes('reminder')) return 'badge-blue'
  return 'badge-yellow'
}

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Recently'

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}
