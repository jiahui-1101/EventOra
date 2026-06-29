<template>
  <main class="app-shell tickets-page">
    <section class="tickets-hero">
      <div>
        <p class="eyebrow">My tickets</p>
        <h1>Your EventOra passes</h1>
        <p>
          View upcoming QR tickets, previous events, and staff-verifiable ticket codes.
        </p>
      </div>

      <article class="ticket-summary-card">
        <span>Active tickets</span>
        <strong>{{ totalActiveTickets }}</strong>
        <small>{{ attendeeEmail }}</small>
      </article>
    </section>

    <div
      v-if="ticketNotice"
      class="ticket-notice"
    >
      {{ ticketNotice }}
    </div>

    <section class="ticket-section">
      <div class="section-heading">
        <p class="eyebrow">Upcoming</p>
        <h2>Ready for check-in</h2>
      </div>

      <div
        v-if="wallet.upcoming.length"
        class="ticket-grid"
      >
        <article
          v-for="ticket in wallet.upcoming"
          :key="ticket.id"
          class="ticket-card"
        >
          <div class="ticket-card-main">
            <span class="ticket-status">Upcoming</span>
            <h3>{{ ticket.eventName }}</h3>
            <p>{{ formatDate(ticket.eventStartAt) }} · {{ ticket.venue }}</p>
            <strong>{{ ticket.ticketCode || ticket.id }}</strong>
            <button
              class="button button-secondary cancel-ticket-button"
              type="button"
              @click="cancelTicket(ticket)"
            >
              Cancel registration
            </button>
          </div>

          <div class="ticket-qr-panel">
            <img
              v-if="qrCodes[ticket.ticketCode || ticket.id]"
              :src="qrCodes[ticket.ticketCode || ticket.id]"
              :alt="`QR code for ${ticket.eventName}`"
            />
            <div
              v-else
              class="qr-placeholder"
            >
              Preparing QR
            </div>
            <small>Ticket code for staff check-in</small>
          </div>
        </article>
      </div>

      <p
        v-else
        class="empty-state"
      >
        No upcoming tickets yet. Register for an event to see your QR pass here.
      </p>
    </section>

    <section class="ticket-section">
      <div class="section-heading">
        <p class="eyebrow">Registrations</p>
        <h2>Payment and waitlist status</h2>
      </div>

      <div
        v-if="registrationCards.length"
        class="registration-status-list"
      >
        <article
          v-for="registration in registrationCards"
          :key="registration.id"
          class="registration-status-card"
        >
          <div>
            <span :class="['ticket-status', statusClass(registration.status)]">
              {{ statusLabel(registration) }}
            </span>
            <h3>{{ registration.event.title || registration.eventId }}</h3>
            <p>{{ registration.event.venue || registration.event.location || 'Venue not set' }}</p>
            <small v-if="registration.status === 'waitlisted'">
              Waitlist position #{{ registration.waitlistPosition }}
            </small>
            <small v-else-if="registration.status === 'pending_payment'">
              Payment hold expires {{ formatDate(registration.paymentHoldExpiresAt) }}
            </small>
          </div>

          <div class="registration-status-actions">
            <router-link
              v-if="registration.status === 'pending_payment'"
              class="button button-primary"
              :to="`/event/${registration.eventId}`"
            >
              Continue payment
            </router-link>
            <router-link
              v-else-if="registration.status === 'waitlisted'"
              class="button button-secondary"
              :to="`/event/${registration.eventId}`"
            >
              View waitlist
            </router-link>
            <button
              v-if="registration.status === 'pending_payment' || registration.status === 'waitlisted'"
              class="button button-secondary"
              type="button"
              @click="cancelRegistration(registration)"
            >
              Cancel
            </button>
          </div>
        </article>
      </div>

      <p
        v-else
        class="empty-state"
      >
        Pending payments and waitlist entries will appear here.
      </p>
    </section>

    <section class="ticket-section">
      <div class="section-heading">
        <p class="eyebrow">Past</p>
        <h2>Previous events</h2>
      </div>

      <div
        v-if="wallet.past.length"
        class="past-ticket-list"
      >
        <article
          v-for="ticket in wallet.past"
          :key="ticket.id"
          class="past-ticket-card"
        >
          <div>
            <h3>{{ ticket.eventName }}</h3>
            <p>{{ formatDate(ticket.eventStartAt) }} · {{ ticket.venue }}</p>
          </div>
          <span>{{ ticket.checkedInAt ? 'Checked in' : 'Not checked in' }}</span>
        </article>
      </div>

      <p
        v-else
        class="empty-state"
      >
        Past tickets will appear after event dates pass.
      </p>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { createTicketQrDataUrl } from '@/utils/ticketQr'
import {
  getMyTicketsApi,
  getMyRegistrationsApi,
  cancelRegistrationApi,
} from '@/api/ticketing'

const authStore = useAuthStore()
const qrCodes = reactive({})
const ticketNotice = ref('')
const wallet = ref({ upcoming: [], past: [], all: [] })
const registrationCards = ref([])

const attendeeEmail = computed(() => authStore.user?.email || 'student@utm.my')
const totalActiveTickets = computed(() => wallet.value.upcoming.length + wallet.value.past.length)

onMounted(() => {
  loadWallet()
})

watchEffect(() => {
  wallet.value.upcoming.forEach(async (ticket) => {
    const key = ticket.ticketCode || ticket.id
    if (!qrCodes[key]) {
      qrCodes[key] = await createTicketQrDataUrl({
        id: ticket.ticketCode || ticket.id,
        qrToken: ticket.qrToken,
        eventId: ticket.eventId,
        societyId: ticket.societyId,
      })
    }
  })
})

async function loadWallet() {
  try {
    const [ticketsResponse, registrationsResponse] = await Promise.all([
      getMyTicketsApi(),
      getMyRegistrationsApi(),
    ])

    wallet.value = ticketsResponse.data.data
    registrationCards.value = registrationsResponse.data.data.filter((registration) =>
      registration.status === 'pending_payment'
      || registration.status === 'waitlisted'
      || registration.status === 'cancelled'
    )
  } catch (error) {
    ticketNotice.value = error.response?.data?.error?.message || 'Unable to load tickets from the backend.'
  }
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

async function cancelTicket(ticket) {
  try {
    const result = await cancelRegistrationApi(ticket.registrationId)

    delete qrCodes[ticket.ticketCode || ticket.id]
    ticketNotice.value = result.data.data.promoted
      ? 'Registration cancelled. The first waitlisted attendee has been promoted automatically.'
      : 'Registration cancelled. The ticket is no longer active.'
    await loadWallet()
  } catch (error) {
    ticketNotice.value = error instanceof Error
      ? (error.response?.data?.error?.message || error.message)
      : 'Unable to cancel this registration.'
  }
}

async function cancelRegistration(registration) {
  try {
    await cancelRegistrationApi(registration.id)
    ticketNotice.value = 'Registration cancelled. Your seat or waitlist position has been released.'
    await loadWallet()
  } catch (error) {
    ticketNotice.value = error instanceof Error
      ? (error.response?.data?.error?.message || error.message)
      : 'Unable to cancel this registration.'
  }
}

function statusLabel(registration) {
  if (registration.status === 'pending_payment') return 'Payment pending'
  if (registration.status === 'waitlisted') return 'Waitlisted'
  if (registration.status === 'cancelled' && registration.paymentStatus === 'expired') return 'Payment expired'
  if (registration.status === 'cancelled') return 'Cancelled'
  return registration.status
}

function statusClass(status) {
  if (status === 'waitlisted') return 'waitlisted'
  if (status === 'pending_payment') return 'pending-payment'
  if (status === 'cancelled') return 'cancelled'
  return ''
}
</script>

<style scoped>
.tickets-page {
  padding-block: 32px 64px;
}

.tickets-hero {
  display: grid;
  grid-template-columns: 1fr minmax(220px, 320px);
  gap: 24px;
  align-items: stretch;
  padding: 32px;
  border-radius: 28px;
  color: #ffffff;
  background:
    radial-gradient(circle at top right, rgba(99, 102, 241, 0.65), transparent 34%),
    linear-gradient(135deg, #111827, #1e3a8a);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
}

.tickets-hero h1,
.tickets-hero p {
  margin: 0;
}

.tickets-hero h1 {
  margin-block: 8px 12px;
  font-size: clamp(2rem, 4vw, 3.5rem);
}

.ticket-summary-card,
.ticket-card,
.past-ticket-card {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.ticket-summary-card {
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 24px;
  border-radius: 24px;
  color: #0f172a;
}

.ticket-summary-card span,
.ticket-summary-card small {
  color: #64748b;
}

.ticket-summary-card strong {
  font-size: 3rem;
}

.ticket-section {
  margin-top: 40px;
}

.ticket-notice {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  color: #1d4ed8;
  background: #eff6ff;
  font-weight: 800;
}

.section-heading {
  margin-bottom: 18px;
}

.section-heading h2,
.ticket-card h3,
.past-ticket-card h3 {
  margin: 0;
  color: #0f172a;
}

.ticket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.ticket-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  padding: 22px;
  border-radius: 24px;
}

.ticket-card-main {
  display: grid;
  align-content: start;
  gap: 10px;
}

.ticket-card-main p,
.past-ticket-card p {
  margin: 0;
  color: #64748b;
}

.ticket-card-main strong {
  width: fit-content;
  padding: 8px 10px;
  border-radius: 12px;
  color: #1d4ed8;
  background: #dbeafe;
  letter-spacing: 0.08em;
}

.cancel-ticket-button {
  width: fit-content;
}

.ticket-status {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  color: #047857;
  background: #d1fae5;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.ticket-status.waitlisted {
  color: #b45309;
  background: #fef3c7;
}

.ticket-status.pending-payment {
  color: #1d4ed8;
  background: #dbeafe;
}

.ticket-status.cancelled {
  color: #64748b;
  background: #f1f5f9;
}

.registration-status-list {
  display: grid;
  gap: 14px;
}

.registration-status-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.registration-status-card h3 {
  margin: 10px 0 6px;
  color: #0f172a;
}

.registration-status-card p,
.registration-status-card small {
  display: block;
  margin: 0;
  color: #64748b;
}

.registration-status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.ticket-qr-panel {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.ticket-qr-panel img,
.qr-placeholder {
  width: 132px;
  height: 132px;
  border-radius: 18px;
}

.ticket-qr-panel img {
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.qr-placeholder {
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
}

.ticket-qr-panel small {
  color: #64748b;
  font-size: 0.75rem;
}

.past-ticket-list {
  display: grid;
  gap: 14px;
}

.past-ticket-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 18px;
}

.past-ticket-card span {
  align-self: center;
  color: #64748b;
  font-weight: 700;
}

.empty-state {
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  color: #64748b;
  background: #f8fafc;
}

@media (max-width: 760px) {
  .tickets-hero,
  .ticket-card,
  .registration-status-card {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
