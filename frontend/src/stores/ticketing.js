import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchTicketingSeed } from '@/api/ticketing'

const TICKETING_STORAGE_KEY = 'eventora_ticketing_state'

function cloneCollection(collection) {
  return collection.map((item) => ({ ...item }))
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

function isValidTicketingSnapshot(snapshot) {
  return Boolean(
    snapshot
      && Array.isArray(snapshot.events)
      && Array.isArray(snapshot.registrations)
      && Array.isArray(snapshot.tickets)
  )
}

function readStoredTicketingState() {
  if (!canUseLocalStorage()) return null

  try {
    const storedState = localStorage.getItem(TICKETING_STORAGE_KEY)
    if (!storedState) return null

    const snapshot = JSON.parse(storedState)
    return isValidTicketingSnapshot(snapshot) ? snapshot : null
  } catch {
    return null
  }
}

function writeStoredTicketingState(snapshot) {
  if (!canUseLocalStorage()) return

  localStorage.setItem(TICKETING_STORAGE_KEY, JSON.stringify(snapshot))
}

export const useTicketingStore = defineStore('ticketing', () => {
  const events = ref([])
  const registrations = ref([])
  const tickets = ref([])

  const isLoading = ref(false)
  const loadError = ref('')
  const hasLoaded = ref(false)

  const publishedEvents = computed(() =>
    events.value.filter((event) => event.status === 'published')
  )

  const activeTickets = computed(() =>
    tickets.value.filter((ticket) => ticket.status === 'active')
  )

  const confirmedRegistrations = computed(() =>
    registrations.value.filter((registration) => registration.status === 'confirmed')
  )

  function getEventById(eventId) {
    return events.value.find((event) => event.id === eventId) || null
  }

  function getRegistrationsForEvent(eventId) {
    return registrations.value.filter((registration) => registration.eventId === eventId)
  }

  function getTicketsForAttendee(email) {
    return tickets.value.filter((ticket) => ticket.attendeeEmail === email)
  }

  function createSnapshot() {
    return {
      events: cloneCollection(events.value),
      registrations: cloneCollection(registrations.value),
      tickets: cloneCollection(tickets.value),
      savedAt: new Date().toISOString(),
    }
  }

  function applySnapshot(snapshot) {
    events.value = cloneCollection(snapshot.events)
    registrations.value = cloneCollection(snapshot.registrations)
    tickets.value = cloneCollection(snapshot.tickets)
    hasLoaded.value = true
  }

  function persistState() {
    writeStoredTicketingState(createSnapshot())
  }

  async function loadSeedData({ force = false } = {}) {
    if (hasLoaded.value && !force) return

    isLoading.value = true
    loadError.value = ''

    try {
      const storedSnapshot = force ? null : readStoredTicketingState()
      if (storedSnapshot) {
        applySnapshot(storedSnapshot)
        return
      }

      const seed = await fetchTicketingSeed()

      applySnapshot(seed)
      persistState()
    } catch (error) {
      loadError.value = error instanceof Error
        ? error.message
        : 'Failed to load ticketing data.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    events,
    registrations,
    tickets,
    isLoading,
    loadError,
    hasLoaded,
    publishedEvents,
    activeTickets,
    confirmedRegistrations,
    getEventById,
    getRegistrationsForEvent,
    getTicketsForAttendee,
    persistState,
    loadSeedData,
  }
})
