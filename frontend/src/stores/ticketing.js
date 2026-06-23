import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchTicketingSeed } from '@/api/ticketing'
import { addNotification } from '@/stores/notifications'
import { parseTicketQrPayload } from '@/utils/ticketQr'
import { createTicketSecurityFields } from '@/utils/ticketTokens'

const TICKETING_STORAGE_KEY = 'eventora_ticketing_state'
const ACTIVE_REGISTRATION_STATUSES = ['confirmed', 'waitlisted', 'pending_payment']
const PAYMENT_HOLD_MINUTES = 10
const PAYMENT_HOLD_MS = PAYMENT_HOLD_MINUTES * 60 * 1000

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
  return String(email || '').trim().toLowerCase()
}

function compareTicketEventTime(first, second) {
  return new Date(first.eventStartAt).getTime() - new Date(second.eventStartAt).getTime()
}

function addMinutes(dateValue, minutes) {
  return new Date(new Date(dateValue).getTime() + minutes * 60 * 1000).toISOString()
}

function resolveSocietyId(eventPayload) {
  if (eventPayload.societyId) return eventPayload.societyId

  const societyName = eventPayload.societyName || eventPayload.society || ''
  const societyKey = societyName.toLowerCase()

  if (societyKey.includes('computing') || societyKey.includes('computer')) return 'UTM-CS'
  if (societyKey.includes('sport')) return 'UTM-SPORTS'
  if (societyKey.includes('culture')) return 'UTM-CULTURE'
  if (societyKey.includes('robot')) return 'UTM-ROBOTICS'

  return societyName || 'CUSTOM-SOCIETY'
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

  function getOrderedWaitlistForEvent(eventId) {
    return [...getWaitlistedRegistrationsForEvent(eventId)].sort((first, second) => {
      const firstPosition = first.waitlistPosition ?? Number.MAX_SAFE_INTEGER
      const secondPosition = second.waitlistPosition ?? Number.MAX_SAFE_INTEGER

      if (firstPosition !== secondPosition) return firstPosition - secondPosition
      return new Date(first.registeredAt).getTime() - new Date(second.registeredAt).getTime()
    })
  }

  function getEventCapacitySummary(eventId) {
    expirePendingPayments()

    const event = getEventById(eventId)
    if (!event) return null

    const confirmedRegistrationsForEvent = getConfirmedRegistrationsForEvent(eventId)
    const seededConfirmedCount = Number(event.confirmedCount || 0)
    const confirmedCount = Math.max(seededConfirmedCount, confirmedRegistrationsForEvent.length)
    const pendingPaymentCount = registrations.value.filter((registration) =>
      registration.eventId === eventId && registration.status === 'pending_payment'
    ).length
    const occupiedCount = confirmedCount + pendingPaymentCount
    const waitlistCount = getWaitlistedRegistrationsForEvent(eventId).length
    const remainingSeats = Math.max(event.capacity - occupiedCount, 0)
    const isFull = remainingSeats === 0

    return {
      eventId,
      capacity: event.capacity,
      confirmedCount,
      pendingPaymentCount,
      occupiedCount,
      waitlistCount,
      remainingSeats,
      isFull,
      canJoinWaitlist: isFull && event.waitlistEnabled,
    }
  }

  function getTicketsForAttendee(email) {
    const attendeeEmail = normalizeEmail(email)

    return tickets.value.filter((ticket) => normalizeEmail(ticket.attendeeEmail) === attendeeEmail)
  }

  function getActiveTicketsForAttendee(email) {
    const attendeeEmail = normalizeEmail(email)

    return activeTickets.value
      .filter((ticket) => normalizeEmail(ticket.attendeeEmail) === attendeeEmail)
      .sort(compareTicketEventTime)
  }

  function getRegistrationsForAttendee(email) {
    const attendeeEmail = normalizeEmail(email)

    return registrations.value
      .filter((registration) => normalizeEmail(registration.attendeeEmail) === attendeeEmail)
      .sort((first, second) => new Date(second.registeredAt).getTime() - new Date(first.registeredAt).getTime())
  }

  function getRegistrationWalletForAttendee(email, now = new Date()) {
    expirePendingPayments(now)

    return getRegistrationsForAttendee(email).map((registration) => {
      const event = getEventById(registration.eventId) || {}
      const ticket = registration.ticketId
        ? tickets.value.find((item) => item.id === registration.ticketId)
        : null

      return {
        ...registration,
        event,
        ticket,
      }
    })
  }

  function getTicketWalletForAttendee(email, now = new Date()) {
    const currentTime = now.getTime()
    const attendeeTickets = getActiveTicketsForAttendee(email)

    return {
      upcoming: attendeeTickets.filter((ticket) =>
        new Date(ticket.eventStartAt).getTime() >= currentTime
      ),
      past: attendeeTickets
        .filter((ticket) => new Date(ticket.eventStartAt).getTime() < currentTime)
        .sort((first, second) => compareTicketEventTime(second, first)),
    }
  }

  function findTicketByCodeOrToken(ticketCode) {
    const parsedPayload = parseTicketQrPayload(ticketCode.trim())
    const normalizedCode = parsedPayload?.token || parsedPayload?.ticketId || ticketCode.trim()

    return tickets.value.find((ticket) =>
      ticket.id === normalizedCode || ticket.qrToken === normalizedCode
    ) || null
  }

  function validateTicketForCheckIn(ticketCode, { eventId, societyId }) {
    const ticket = findTicketByCodeOrToken(ticketCode)

    if (!ticket || ticket.status !== 'active') {
      return {
        status: 'invalid',
        message: 'Invalid ticket.',
        ticket: null,
      }
    }

    if (ticket.societyId !== societyId) {
      return {
        status: 'wrong_society',
        message: 'This organizer cannot check in tickets for another society.',
        ticket,
      }
    }

    if (ticket.eventId !== eventId) {
      return {
        status: 'wrong_event',
        message: 'This ticket belongs to a different event.',
        ticket,
      }
    }

    if (ticket.checkedInAt) {
      return {
        status: 'already_checked_in',
        message: 'This attendee has already checked in.',
        ticket,
      }
    }

    return {
      status: 'ready',
      message: 'Ticket is valid for check-in.',
      ticket,
    }
  }

  function checkInTicket(ticketCode, organizerContext) {
    const validation = validateTicketForCheckIn(ticketCode, organizerContext)
    if (validation.status !== 'ready') return validation

    const checkedInAt = new Date().toISOString()
    validation.ticket.checkedInAt = checkedInAt
    validation.ticket.checkedInBy = organizerContext.organizerId
    persistState()

    return {
      status: 'success',
      message: 'Check-in successful.',
      ticket: validation.ticket,
      checkedInAt,
    }
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

  function expirePendingPayments(now = new Date()) {
    let changed = false
    const currentTime = now.getTime()

    registrations.value.forEach((registration) => {
      if (registration.status !== 'pending_payment') return

      const expiresAt = registration.paymentHoldExpiresAt
        || addMinutes(registration.registeredAt, PAYMENT_HOLD_MINUTES)

      if (new Date(expiresAt).getTime() > currentTime) return

      registration.status = 'cancelled'
      registration.paymentStatus = 'expired'
      registration.cancelledAt = now.toISOString()
      changed = true
    })

    if (changed) {
      persistState()
    }

    return changed
  }

  function assertEventRegisterable(event, now = new Date()) {
    if (!event) throw new Error('Event not found.')
    if (event.status !== 'published') throw new Error('Registration is only available for published events.')

    if (event.registrationDeadline && new Date(event.registrationDeadline).getTime() < now.getTime()) {
      throw new Error('Registration has closed for this event.')
    }

    if (event.startAt && new Date(event.startAt).getTime() <= now.getTime()) {
      throw new Error('Registration is closed because this event has already started.')
    }
  }

  function adjustConfirmedCount(eventId, delta) {
    const event = getEventById(eventId)
    if (!event) return

    const currentCount = Number(event.confirmedCount || 0)
    event.confirmedCount = Math.max(currentCount + delta, 0)
  }

  function ensureEventAvailable(eventPayload) {
    if (!eventPayload?.id) return null

    const existingEvent = getEventById(eventPayload.id)
    const normalisedEvent = {
      ...eventPayload,
      title: eventPayload.title,
      description: eventPayload.description || 'Event details will be shared by the organiser.',
      societyId: resolveSocietyId(eventPayload),
      societyName: eventPayload.societyName || eventPayload.society || 'EventOra Society',
      category: eventPayload.category || 'academic',
      priceType: eventPayload.priceType || (Number(eventPayload.price || eventPayload.feeAmount || 0) > 0 ? 'paid' : 'free'),
      price: Number(eventPayload.price ?? eventPayload.feeAmount ?? 0),
      currency: eventPayload.currency || 'MYR',
      startAt: eventPayload.startAt || eventPayload.date || new Date().toISOString(),
      endAt: eventPayload.endAt || eventPayload.date || eventPayload.startAt || new Date().toISOString(),
      registrationDeadline: eventPayload.registrationDeadline || eventPayload.deadline || eventPayload.date || new Date().toISOString(),
      venue: eventPayload.venue || eventPayload.location || 'Venue not set',
      capacity: Number(eventPayload.capacity || 0),
      confirmedCount: Number(eventPayload.confirmedCount ?? eventPayload.registrations ?? 0),
      waitlistEnabled: eventPayload.waitlistEnabled ?? eventPayload.waitlist !== 'disabled',
      status: eventPayload.status || 'published',
      coverClass: eventPayload.coverClass || 'academic-cover',
      badgeClass: eventPayload.badgeClass || 'badge-blue',
    }

    if (existingEvent) {
      Object.assign(existingEvent, normalisedEvent)
      persistState()
      return existingEvent
    }

    events.value.push(normalisedEvent)
    persistState()
    return normalisedEvent
  }

  function notifyAttendee({ recipientEmail, title, message, type = 'Ticketing', badgeClass = 'badge-blue' }) {
    addNotification({
      audience: 'attendee',
      recipientEmail: normalizeEmail(recipientEmail),
      type,
      title,
      message,
      badgeClass,
    })
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

  function createPendingPaymentRegistration(event, attendee, registeredAt, source = 'checkout') {
    return {
      id: createRegistrationId(event.id, attendee.id),
      eventId: event.id,
      attendeeId: attendee.id,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      waitlistPosition: null,
      ticketId: null,
      registeredAt,
      paymentHoldExpiresAt: addMinutes(registeredAt, PAYMENT_HOLD_MINUTES),
      source,
      cancelledAt: null,
    }
  }

  function joinWaitlist(eventId, attendee) {
    const event = getEventById(eventId)
    assertEventRegisterable(event)
    assertCanRegister(eventId, attendee)

    const capacitySummary = getEventCapacitySummary(eventId)
    if (!capacitySummary?.isFull) {
      throw new Error('Seats are still available for this event.')
    }
    if (!capacitySummary.canJoinWaitlist) {
      throw new Error('This event is full and waitlist is not available.')
    }

    const registeredAt = new Date().toISOString()
    const registration = {
      id: createRegistrationId(eventId, attendee.id),
      eventId,
      attendeeId: attendee.id,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      status: 'waitlisted',
      paymentStatus: event.priceType === 'paid' ? 'unpaid' : 'not_required',
      waitlistPosition: capacitySummary.waitlistCount + 1,
      ticketId: null,
      registeredAt,
      cancelledAt: null,
    }

    registrations.value.push(registration)
    notifyAttendee({
      recipientEmail: registration.attendeeEmail,
      title: 'Waitlist joined',
      message: `${event.title} is full. You are now #${registration.waitlistPosition} on the waitlist.`,
      badgeClass: 'badge-yellow',
    })
    persistState()

    return registration
  }

  function registerFreeEvent(eventId, attendee) {
    const event = getEventById(eventId)
    assertEventRegisterable(event)
    if (event.priceType !== 'free') throw new Error('This event requires payment.')
    assertCanRegister(eventId, attendee)

    const capacitySummary = getEventCapacitySummary(eventId)
    if (capacitySummary?.isFull) {
      return {
        registration: joinWaitlist(eventId, attendee),
        ticket: null,
      }
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
      paymentHoldExpiresAt: null,
      cancelledAt: null,
    }
    const ticket = createConfirmedTicket(event, registration, registeredAt)

    registration.ticketId = ticket.id
    registrations.value.push(registration)
    tickets.value.push(ticket)
    adjustConfirmedCount(eventId, 1)
    notifyAttendee({
      recipientEmail: registration.attendeeEmail,
      title: 'Registration confirmed',
      message: `${event.title} is confirmed. Your QR ticket is ready in My Tickets.`,
      badgeClass: 'badge-green',
    })
    persistState()

    return { registration, ticket }
  }

  function beginPaidRegistration(eventId, attendee) {
    const event = getEventById(eventId)
    assertEventRegisterable(event)
    if (event.priceType !== 'paid') throw new Error('This event does not require payment.')
    assertCanRegister(eventId, attendee)

    const capacitySummary = getEventCapacitySummary(eventId)
    if (capacitySummary?.isFull) {
      return {
        registration: joinWaitlist(eventId, attendee),
        payment: null,
      }
    }

    const registeredAt = new Date().toISOString()
    const registration = createPendingPaymentRegistration(event, attendee, registeredAt)

    registrations.value.push(registration)
    notifyAttendee({
      recipientEmail: registration.attendeeEmail,
      title: 'Payment pending',
      message: `${event.title} has been reserved for 10 minutes while payment is completed.`,
      type: 'Payment',
      badgeClass: 'badge-yellow',
    })
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
    expirePendingPayments()
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
    registration.paymentHoldExpiresAt = null
    tickets.value.push(ticket)
    adjustConfirmedCount(registration.eventId, 1)
    notifyAttendee({
      recipientEmail: registration.attendeeEmail,
      title: 'Payment confirmed',
      message: `${event.title} is confirmed. Your QR ticket is ready in My Tickets.`,
      type: 'Payment',
      badgeClass: 'badge-green',
    })
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
    registration.paymentHoldExpiresAt = null
    notifyAttendee({
      recipientEmail: registration.attendeeEmail,
      title: 'Payment unsuccessful',
      message: 'Your registration was not completed because the payment was declined.',
      type: 'Payment',
      badgeClass: 'badge-red',
    })
    persistState()

    return registration
  }

  function renumberWaitlist(eventId) {
    getOrderedWaitlistForEvent(eventId).forEach((registration, index) => {
      registration.waitlistPosition = index + 1
    })
  }

  function promoteNextWaitlistedRegistration(eventId) {
    const event = getEventById(eventId)
    if (!event) throw new Error('Event not found.')

    const nextRegistration = getOrderedWaitlistForEvent(eventId)[0]
    if (!nextRegistration) return null

    const promotedAt = new Date().toISOString()

    let ticket = null
    nextRegistration.status = event.priceType === 'paid' ? 'pending_payment' : 'confirmed'
    nextRegistration.paymentStatus = event.priceType === 'paid' ? 'unpaid' : 'not_required'
    nextRegistration.waitlistPosition = null
    nextRegistration.paymentHoldExpiresAt = event.priceType === 'paid'
      ? addMinutes(promotedAt, PAYMENT_HOLD_MINUTES)
      : null

    if (event.priceType === 'free') {
      ticket = createConfirmedTicket(event, nextRegistration, promotedAt)
      nextRegistration.ticketId = ticket.id
      tickets.value.push(ticket)
      adjustConfirmedCount(eventId, 1)
    }

    renumberWaitlist(eventId)
    notifyAttendee({
      recipientEmail: nextRegistration.attendeeEmail,
      title: 'Waitlist promoted',
      message: event.priceType === 'paid'
        ? `A seat opened for ${event.title}. Complete payment to receive your QR ticket.`
        : `A seat opened for ${event.title}. Your registration is confirmed and your QR ticket is ready.`,
      badgeClass: 'badge-green',
    })

    return { registration: nextRegistration, ticket }
  }

  function cancelRegistration(registrationId) {
    const registration = registrations.value.find((item) => item.id === registrationId)
    if (!registration) throw new Error('Registration not found.')
    if (registration.status === 'cancelled') {
      throw new Error('This registration has already been cancelled.')
    }

    const cancelledAt = new Date().toISOString()
    const wasConfirmed = registration.status === 'confirmed'
    const ticket = registration.ticketId
      ? tickets.value.find((item) => item.id === registration.ticketId)
      : null

    registration.status = 'cancelled'
    registration.cancelledAt = cancelledAt

    if (registration.paymentStatus === 'paid') {
      registration.paymentStatus = 'refunded'
    } else if (registration.paymentStatus === 'unpaid') {
      registration.paymentStatus = 'cancelled'
    }
    registration.paymentHoldExpiresAt = null

    if (ticket) {
      ticket.status = 'cancelled'
      ticket.cancelledAt = cancelledAt
    }

    if (wasConfirmed) {
      adjustConfirmedCount(registration.eventId, -1)
    }

    const promoted = wasConfirmed
      ? promoteNextWaitlistedRegistration(registration.eventId)
      : null
    if (!wasConfirmed) {
      renumberWaitlist(registration.eventId)
    }

    notifyAttendee({
      recipientEmail: registration.attendeeEmail,
      title: 'Registration cancelled',
      message: `Your registration has been cancelled.`,
      badgeClass: 'badge-gray',
    })

    persistState()

    return { registration, ticket, promoted }
  }

  function cancelEvent(eventId, reason = 'The event has been cancelled by the organiser.') {
    const event = getEventById(eventId)
    if (!event) return null

    event.status = 'cancelled'
    event.cancelledAt = new Date().toISOString()
    event.cancellationReason = reason

    registrations.value
      .filter((registration) =>
        registration.eventId === eventId
        && ACTIVE_REGISTRATION_STATUSES.includes(registration.status)
      )
      .forEach((registration) => {
        registration.status = 'cancelled'
        registration.cancelledAt = event.cancelledAt
        registration.paymentHoldExpiresAt = null

        if (registration.paymentStatus === 'paid') {
          registration.paymentStatus = 'refunded'
        } else if (registration.paymentStatus === 'unpaid') {
          registration.paymentStatus = 'cancelled'
        }

        notifyAttendee({
          recipientEmail: registration.attendeeEmail,
          title: 'Event cancelled',
          message: `${event.title} has been cancelled. Your registration is no longer active.`,
          type: 'Event update',
          badgeClass: 'badge-red',
        })
      })

    tickets.value
      .filter((ticket) => ticket.eventId === eventId && ticket.status === 'active')
      .forEach((ticket) => {
        ticket.status = 'cancelled'
        ticket.cancelledAt = event.cancelledAt
      })

    event.confirmedCount = 0
    persistState()
    return event
  }

  async function loadSeedData({ force = false } = {}) {
    if (hasLoaded.value && !force) return

    isLoading.value = true
    loadError.value = ''

    try {
      const storedSnapshot = force ? null : readStoredTicketingState()
      if (storedSnapshot) {
        applySnapshot(storedSnapshot)
        expirePendingPayments()
        return
      }

      const seed = await fetchTicketingSeed()

      applySnapshot(seed)
      expirePendingPayments()
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
    getOrderedWaitlistForEvent,
    getEventCapacitySummary,
    getTicketsForAttendee,
    getActiveTicketsForAttendee,
    getTicketWalletForAttendee,
    getRegistrationsForAttendee,
    getRegistrationWalletForAttendee,
    findTicketByCodeOrToken,
    validateTicketForCheckIn,
    checkInTicket,
    getActiveRegistrationForAttendee,
    persistState,
    ensureEventAvailable,
    expirePendingPayments,
    joinWaitlist,
    registerFreeEvent,
    beginPaidRegistration,
    completeMockPayment,
    declineMockPayment,
    promoteNextWaitlistedRegistration,
    cancelRegistration,
    cancelEvent,
    loadSeedData,
  }
})
