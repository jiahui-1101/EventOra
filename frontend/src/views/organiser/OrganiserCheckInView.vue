<template>
  <main class="checkin-shell">
    <section class="checkin-hero">
      <div>
        <p class="eyebrow">QR check-in</p>
        <h1>Scan attendee tickets</h1>
        <p>
          Validate attendee QR tickets by event and society. If the camera cannot be used, enter the ticket code manually.
        </p>
      </div>

      <article class="scanner-status-card">
        <span>Selected event</span>
        <strong>{{ selectedEvent?.title || 'Choose an event' }}</strong>
        <small>{{ selectedEvent?.societyName || 'Organizer society scope' }}</small>
      </article>
    </section>

    <section class="checkin-layout">
      <article class="scanner-card">
        <div class="event-picker">
          <label for="event-select">Event</label>
          <select
            id="event-select"
            v-model="selectedEventId"
          >
            <option
              v-for="event in organiserEvents"
              :key="event.id"
              :value="event.id"
            >
              {{ event.title }}
            </option>
          </select>
        </div>

        <div class="checkin-stats" aria-label="Check-in progress">
          <article>
            <span>Tickets issued</span>
            <strong>{{ selectedEventTickets.length }}</strong>
          </article>
          <article>
            <span>Checked in</span>
            <strong>{{ checkedInTickets.length }}</strong>
          </article>
          <article>
            <span>Remaining</span>
            <strong>{{ pendingCheckIns.length }}</strong>
          </article>
        </div>

        <div class="scanner-window">
          <div class="scanner-corners"></div>
          <div class="scanner-line"></div>
          <p>{{ cameraMessage }}</p>
        </div>

        <div class="scanner-actions">
          <button
            class="button button-primary"
            type="button"
            @click="requestCameraPermission"
          >
            Start camera scanner
          </button>
        </div>

        <form
          class="manual-code-form"
          @submit.prevent="submitManualCode"
        >
          <label for="ticket-code">Enter ticket code manually</label>
          <div>
            <input
              id="ticket-code"
              v-model.trim="manualCode"
              type="text"
              placeholder="EVT-ABCD-1234-WXYZ"
            />
            <button
              class="button button-primary"
              type="submit"
            >
              Check in
            </button>
          </div>
        </form>
      </article>

      <aside :class="['result-card', result.status]">
        <span>{{ resultLabel }}</span>
        <h2>{{ result.message }}</h2>
        <dl v-if="result.ticket">
          <div>
            <dt>Attendee</dt>
            <dd>{{ result.ticket.attendeeName }}</dd>
          </div>
          <div>
            <dt>Ticket</dt>
            <dd>{{ result.ticket.id }}</dd>
          </div>
          <div>
            <dt>Event</dt>
            <dd>{{ result.ticket.eventName }}</dd>
          </div>
          <div v-if="result.ticket.checkedInAt">
            <dt>Checked in</dt>
            <dd>{{ formatDate(result.ticket.checkedInAt) }}</dd>
          </div>
        </dl>

        <div
          v-if="recentCheckIns.length"
          class="recent-checkins"
        >
          <h3>Recent check-ins</h3>
          <ul>
            <li
              v-for="ticket in recentCheckIns"
              :key="ticket.id"
            >
              <span>{{ ticket.attendeeName }}</span>
              <small>{{ formatTime(ticket.checkedInAt) }}</small>
            </li>
          </ul>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTicketingStore } from '@/stores/ticketing'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const ticketingStore = useTicketingStore()

const selectedEventId = ref(route.params.eventId || '')
const manualCode = ref('')
const cameraMessage = ref('Camera scanner is ready. Start the scanner and place the QR code inside the frame.')
const result = ref({
  status: 'idle',
  message: 'Scan or enter a ticket code to begin.',
  ticket: null,
})

const organiserSocietyId = computed(() => authStore.user?.societyId || 'UTM-CS')

const organiserEvents = computed(() =>
  ticketingStore.publishedEvents.filter((event) => event.societyId === organiserSocietyId.value)
)

const selectedEvent = computed(() =>
  ticketingStore.getEventById(selectedEventId.value) || organiserEvents.value[0] || null
)
const selectedEventTickets = computed(() =>
  ticketingStore.activeTickets.filter((ticket) => ticket.eventId === selectedEvent.value?.id)
)
const checkedInTickets = computed(() =>
  selectedEventTickets.value.filter((ticket) => ticket.checkedInAt)
)
const pendingCheckIns = computed(() =>
  selectedEventTickets.value.filter((ticket) => !ticket.checkedInAt)
)
const recentCheckIns = computed(() =>
  [...checkedInTickets.value]
    .sort((first, second) => new Date(second.checkedInAt).getTime() - new Date(first.checkedInAt).getTime())
    .slice(0, 4)
)

const resultLabel = computed(() => {
  const labels = {
    idle: 'Waiting',
    success: 'Success',
    invalid: 'Invalid ticket',
    wrong_society: 'Wrong society',
    wrong_event: 'Wrong event',
    already_checked_in: 'Duplicate check-in',
    ready: 'Ready',
  }

  return labels[result.value.status] || 'Result'
})

onMounted(async () => {
  await ticketingStore.loadSeedData()
  if (!selectedEventId.value && organiserEvents.value[0]) {
    selectedEventId.value = organiserEvents.value[0].id
  }
})

watch(selectedEventId, (eventId) => {
  if (eventId && eventId !== route.params.eventId) {
    router.replace({ name: 'organiser-check-in', params: { eventId } })
  }
})

async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.value = 'Camera access is unavailable on this device. Enter the ticket code manually.'
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((track) => track.stop())
    cameraMessage.value = 'Camera permission granted. Point the attendee QR code inside the frame.'
  } catch {
    cameraMessage.value = 'Camera permission was denied. Enter the ticket code manually.'
  }
}

function submitManualCode() {
  processTicketCode(manualCode.value)
}

function processTicketCode(ticketCode) {
  if (!selectedEvent.value) {
    result.value = {
      status: 'invalid',
      message: 'Select an event before checking in tickets.',
      ticket: null,
    }
    return
  }

  result.value = ticketingStore.checkInTicket(ticketCode, {
    eventId: selectedEvent.value.id,
    societyId: selectedEvent.value.societyId,
    organizerId: authStore.user?.email || 'organiser@utm.my',
  })
  manualCode.value = ''
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

function formatTime(dateValue) {
  return new Intl.DateTimeFormat('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue))
}
</script>

<style scoped>
.checkin-shell {
  padding-block: 32px 64px;
}

.checkin-hero {
  display: grid;
  grid-template-columns: 1fr minmax(240px, 340px);
  gap: 24px;
  padding: 32px;
  border-radius: 28px;
  color: #ffffff;
  background: linear-gradient(135deg, #0f172a, #4338ca);
}

.checkin-hero h1,
.checkin-hero p {
  margin: 0;
}

.checkin-hero h1 {
  margin-block: 8px 12px;
  font-size: clamp(2rem, 4vw, 3.3rem);
}

.scanner-status-card,
.scanner-card,
.result-card {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.scanner-status-card {
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 24px;
  border-radius: 24px;
  color: #0f172a;
}

.scanner-status-card span,
.scanner-status-card small {
  color: #64748b;
}

.checkin-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  margin-top: 28px;
}

.scanner-card,
.result-card {
  border-radius: 24px;
  padding: 24px;
}

.event-picker,
.manual-code-form {
  display: grid;
  gap: 8px;
}

.event-picker label,
.manual-code-form label {
  color: #475569;
  font-weight: 800;
}

.event-picker select,
.manual-code-form input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
}

.checkin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 18px;
}

.checkin-stats article {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.checkin-stats span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.checkin-stats strong {
  color: #0f172a;
  font-size: 1.5rem;
}

.scanner-window {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 320px;
  margin-block: 22px;
  overflow: hidden;
  border-radius: 28px;
  color: #c7d2fe;
  background:
    linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)),
    radial-gradient(circle, rgba(79, 70, 229, 0.5), transparent 55%);
}

.scanner-corners {
  width: 190px;
  height: 190px;
  border: 4px solid #38bdf8;
  border-radius: 24px;
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.45);
}

.scanner-line {
  position: absolute;
  left: 25%;
  right: 25%;
  height: 3px;
  background: #22c55e;
  animation: scan-line 2s ease-in-out infinite;
}

.scanner-window p {
  position: absolute;
  bottom: 22px;
  margin: 0;
  text-align: center;
}

.scanner-actions,
.manual-code-form div {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.manual-code-form {
  margin-top: 22px;
}

.manual-code-form input {
  flex: 1 1 260px;
}

.result-card {
  align-self: start;
  display: grid;
  gap: 16px;
  border-top: 6px solid #94a3b8;
}

.result-card.success {
  border-top-color: #22c55e;
}

.result-card.invalid,
.result-card.wrong_society,
.result-card.wrong_event {
  border-top-color: #ef4444;
}

.result-card.already_checked_in {
  border-top-color: #f59e0b;
}

.result-card span {
  color: #64748b;
  font-weight: 900;
  text-transform: uppercase;
}

.result-card h2 {
  margin: 0;
  color: #0f172a;
}

.result-card dl {
  display: grid;
  gap: 14px;
  margin: 0;
}

.result-card dt {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.result-card dd {
  margin: 4px 0 0;
  color: #0f172a;
  font-weight: 800;
}

.recent-checkins {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.recent-checkins h3 {
  margin: 0 0 10px;
  color: #0f172a;
}

.recent-checkins ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent-checkins li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #0f172a;
  font-weight: 800;
}

.recent-checkins small {
  color: #64748b;
  font-weight: 700;
}

@keyframes scan-line {
  0% {
    top: 25%;
  }
  50% {
    top: 70%;
  }
  100% {
    top: 25%;
  }
}

@media (max-width: 820px) {
  .checkin-hero,
  .checkin-layout {
    grid-template-columns: 1fr;
  }

  .checkin-stats {
    grid-template-columns: 1fr;
  }
}
</style>
