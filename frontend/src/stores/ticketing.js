import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchTicketingSeed } from '@/api/ticketing'
import { createTicketSecurityFields } from '@/utils/ticketTokens'

const TICKETING_STORAGE_KEY = 'eventora_ticketing_state'
const ACTIVE_REGISTRATION_STATUSES = ['confirmed', 'waitlisted', 'pending_payment']

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

function createRegistrationId(eventId, attendeeId) {
  return `registration-${eventId}-${attendeeId}-${Date.now()}`
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
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

  const activeRegistrations = computed(() =>
    registrations.value.filter((registration) =>
      ACTIVE_REGISTRATION_STATUSES.includes(registration.status)
    )
  )

  function getEventById(eventId) {
    return events.value.find((event) => event.id === eventId) || null
  }

  function getRegistrationsForEvent(eventId) {
    return registrations.value.filter((registration) => registration.eventId === eventId)
  }

  function getActiveRegistrationsForEvent(eventId) {
    return activeRegistrations.value.filter((registration) => registration.eventId === eventId)
  }

  function getConfirmedRegistrationsForEvent(eventId) {
    return confirmedRegistrations.value.filter((registration) => registration.eventId === eventId)
  }

  function getWaitlistedRegistrationsForEvent(eventId) {
    return registrations.value.filter((registration) =>
      registration.eventId === eventId && registration.status === 'waitlisted'
    )
  }

  function getEventCapacitySummary(eventId) {
    const event = getEventById(eventId)
    if (!event) return null

    const confirmedCount = getConfirmedRegistrationsForEvent(eventId).length
    const waitlistCount = getWaitlistedRegistrationsForEvent(eventId).length
    const remainingSeats = Math.max(event.capacity - confirmedCount, 0)
    const isFull = remainingSeats === 0

    return {
      eventId,
      capacity: event.capacity,
      confirmedCount,
      waitlistCount,
      remainingSeats,
      isFull,
      canJoinWaitlist: isFull && event.waitlistEnabled,
    }
  }

  function getTicketsForAttendee(email) {
    return tickets.value.filter((ticket) => ticket.attendeeEmail === email)
  }

  function getActiveRegistrationForAttendee(eventId, attendee) {
    const attendeeEmail = normalizeEmail(attendee.email)

    return activeRegistrations.value.find((registration) =>
      registration.eventId === eventId
        && (
          registration.attendeeId === attendee.id
          || normalizeEmail(registration.attendeeEmail) === attendeeEmail
        )
    ) || null
  }

  function assertCanRegister(eventId, attendee) {
    const existingRegistration = getActiveRegistrationForAttendee(eventId, attendee)
    if (existingRegistration) {
      throw new Error('You are already registered for this event.')
    }
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

  function createConfirmedTicket(event, registration, issuedAt) {
    const securityFields = createTicketSecurityFields()

    return {
      id: securityFields.code,
      qrToken: securityFields.token,
      registrationId: registration.id,
      eventId: event.id,
      eventName: event.title,
      eventStartAt: event.startAt,
      venue: event.venue,
      societyId: event.societyId,
      attendeeId: registration.attendeeId,
      attendeeName: registration.attendeeName,
      attendeeEmail: registration.attendeeEmail,
      status: 'active',
      issuedAt,
      checkedInAt: null,
      checkedInBy: null,
    }
  }

  function registerFreeEvent(eventId, attendee) {
    const event = getEventById(eventId)
    if (!event) throw new Error('Event not found.')
    if (event.priceType !== 'free') throw new Error('This event requires payment.')
    assertCanRegister(eventId, attendee)

    const capacitySummary = getEventCapacitySummary(eventId)
    if (capacitySummary?.isFull) {
      throw new Error('This event is full.')
    }

    const registeredAt = new Date().toISOString()
    const registration = {
      id: createRegistrationId(eventId, attendee.id),
      eventId,
      attendeeId: attendee.id,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      status: 'confirmed',
      paymentStatus: 'not_required',
      waitlistPosition: null,
      ticketId: null,
      registeredAt,
      cancelledAt: null,
    }
    const ticket = createConfirmedTicket(event, registration, registeredAt)

    registration.ticketId = ticket.id
    registrations.value.push(registration)
    tickets.value.push(ticket)
    persistState()

    return { registration, ticket }
  }

  function beginPaidRegistration(eventId, attendee) {
    const event = getEventById(eventId)
    if (!event) throw new Error('Event not found.')
    if (event.priceType !== 'paid') throw new Error('This event does not require payment.')
    assertCanRegister(eventId, attendee)

    const capacitySummary = getEventCapacitySummary(eventId)
    if (capacitySummary?.isFull) {
      throw new Error('This event is full.')
    }

    const registeredAt = new Date().toISOString()
    const registration = {
      id: createRegistrationId(eventId, attendee.id),
      eventId,
      attendeeId: attendee.id,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      waitlistPosition: null,
      ticketId: null,
      registeredAt,
      cancelledAt: null,
    }

    registrations.value.push(registration)
    persistState()

    return {
      registration,
      payment: {
        amount: event.price,
        currency: event.currency,
        eventTitle: event.title,
      },
    }
  }

  function completeMockPayment(registrationId) {
    const registration = registrations.value.find((item) => item.id === registrationId)
    if (!registration) throw new Error('Registration not found.')
    if (registration.status !== 'pending_payment') {
      throw new Error('Only pending payments can be completed.')
    }

    const event = getEventById(registration.eventId)
    if (!event) throw new Error('Event not found.')

    const paidAt = new Date().toISOString()
    const ticket = createConfirmedTicket(event, registration, paidAt)

    registration.status = 'confirmed'
    registration.paymentStatus = 'paid'
    registration.ticketId = ticket.id
    tickets.value.push(ticket)
    persistState()

    return { registration, ticket }
  }

  function declineMockPayment(registrationId) {
    const registration = registrations.value.find((item) => item.id === registrationId)
    if (!registration) throw new Error('Registration not found.')
    if (registration.status !== 'pending_payment') {
      throw new Error('Only pending payments can be declined.')
    }

    registration.status = 'cancelled'
    registration.paymentStatus = 'failed'
    registration.cancelledAt = new Date().toISOString()
    persistState()

    return registration
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
    activeRegistrations,
    getEventById,
    getRegistrationsForEvent,
    getActiveRegistrationsForEvent,
    getConfirmedRegistrationsForEvent,
    getWaitlistedRegistrationsForEvent,
    getEventCapacitySummary,
    getTicketsForAttendee,
    getActiveRegistrationForAttendee,
    persistState,
    registerFreeEvent,
    beginPaidRegistration,
    completeMockPayment,
    declineMockPayment,
    loadSeedData,
  }
})
