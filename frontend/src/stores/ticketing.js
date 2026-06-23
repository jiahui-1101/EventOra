import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchTicketingSeed } from '@/api/ticketing'

function cloneCollection(collection) {
  return collection.map((item) => ({ ...item }))
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

  async function loadSeedData({ force = false } = {}) {
    if (hasLoaded.value && !force) return

    isLoading.value = true
    loadError.value = ''

    try {
      const seed = await fetchTicketingSeed()

      events.value = cloneCollection(seed.events)
      registrations.value = cloneCollection(seed.registrations)
      tickets.value = cloneCollection(seed.tickets)
      hasLoaded.value = true
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
    loadSeedData,
  }
})
