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
