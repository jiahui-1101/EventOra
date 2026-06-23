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
            <strong>{{ ticket.id }}</strong>
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
              v-if="qrCodes[ticket.id]"
              :src="qrCodes[ticket.id]"
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
import { useTicketingStore } from '@/stores/ticketing'
import { createTicketQrDataUrl } from '@/utils/ticketQr'

const authStore = useAuthStore()
const ticketingStore = useTicketingStore()
const qrCodes = reactive({})
const ticketNotice = ref('')

const attendeeEmail = computed(() => authStore.user?.email || 'student@utm.my')
const wallet = computed(() => ticketingStore.getTicketWalletForAttendee(attendeeEmail.value))
const totalActiveTickets = computed(() => wallet.value.upcoming.length + wallet.value.past.length)

onMounted(() => {
  ticketingStore.loadSeedData()
})

watchEffect(() => {
  wallet.value.upcoming.forEach(async (ticket) => {
    if (!qrCodes[ticket.id]) {
      qrCodes[ticket.id] = await createTicketQrDataUrl(ticket)
    }
  })
})

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

function cancelTicket(ticket) {
  try {
    const result = ticketingStore.cancelRegistration(ticket.registrationId)

    delete qrCodes[ticket.id]
    ticketNotice.value = result.promoted
      ? 'Registration cancelled. The first waitlisted attendee has been promoted automatically.'
      : 'Registration cancelled. The ticket is no longer active.'
  } catch (error) {
    ticketNotice.value = error instanceof Error
      ? error.message
      : 'Unable to cancel this registration.'
  }
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
  .ticket-card {
    grid-template-columns: 1fr;
  }
}
</style>
