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
          <video
            v-show="scannerActive"
            ref="videoRef"
            autoplay
            muted
            playsinline
            class="scanner-video"
          ></video>
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

        <section class="issued-ticket-panel">
          <div class="issued-ticket-heading">
            <div>
              <span>Issued tickets</span>
              <h2>Attendee check-in list</h2>
            </div>
            <small>{{ selectedEventTickets.length }} active ticket{{ selectedEventTickets.length === 1 ? '' : 's' }}</small>
          </div>

          <div
            v-if="selectedEventTickets.length"
            class="issued-ticket-list"
          >
            <article
              v-for="ticket in selectedEventTickets"
              :key="ticket.id"
              :class="['issued-ticket-row', { checked: ticket.checkedInAt }]"
            >
              <div>
                <strong>{{ ticket.attendeeName }}</strong>
                <small>{{ ticket.attendeeEmail }}</small>
              </div>
              <code>{{ ticket.ticketCode || ticket.id }}</code>
              <span>{{ ticket.checkedInAt ? 'Checked in' : 'Not checked in' }}</span>
              <button
                class="button button-secondary"
                type="button"
                :disabled="Boolean(ticket.checkedInAt)"
                @click="useTicketCode(ticket.ticketCode || ticket.id)"
              >
                Use code
              </button>
            </article>
          </div>

          <p
            v-else
            class="issued-ticket-empty"
          >
            No active tickets have been issued for this event yet. Register as an attendee first, then return here with the organiser account.
          </p>
        </section>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jsQR from 'jsqr'
import { useAuthStore } from '@/stores/auth'
import { getOrganiserEventsApi } from '@/api/dashboard'
import { getCheckInTicketsApi, checkInTicketApi } from '@/api/ticketing'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const selectedEventId = ref(route.params.eventId || '')
const organiserEvents = ref([])
const selectedEventTickets = ref([])
const manualCode = ref('')
const cameraMessage = ref('Camera scanner is ready. Start the scanner and place the QR code inside the frame.')
const videoRef = ref(null)
const scannerCanvas = document.createElement('canvas')
const scannerContext = scannerCanvas.getContext('2d', { willReadFrequently: true })
const scannerActive = ref(false)
let scannerStream = null
let scannerFrame = 0
const result = ref({
  status: 'idle',
  message: 'Scan or enter a ticket code to begin.',
  ticket: null,
})

const selectedEvent = computed(() =>
  organiserEvents.value.find((event) => Number(event.id) === Number(selectedEventId.value)) || organiserEvents.value[0] || null
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
    invalid_ticket: 'Invalid ticket',
    wrong_society: 'Wrong society',
    wrong_event: 'Wrong event',
    already_checked_in: 'Duplicate check-in',
    ready: 'Ready',
  }

  return labels[result.value.status] || 'Result'
})

onMounted(async () => {
  await loadOrganiserEvents()
  if (!selectedEventId.value && organiserEvents.value[0]) {
    selectedEventId.value = organiserEvents.value[0].id
  }
  await loadSelectedEventTickets()
})

async function loadOrganiserEvents() {
  try {
    const response = await getOrganiserEventsApi()
    organiserEvents.value = response.data.data
      .filter((event) => ['published', 'completed'].includes(event.status))
      .map((event) => ({
        ...event,
        societyName: event.societyName || event.society_name || event.society || 'Organiser society',
      }))
  } catch (error) {
    result.value = {
      status: 'invalid',
      message: error.response?.data?.error?.message || 'Unable to load organiser events from backend.',
      ticket: null,
    }
  }
}

async function loadSelectedEventTickets() {
  if (!selectedEvent.value) {
    selectedEventTickets.value = []
    return
  }

  try {
    const response = await getCheckInTicketsApi(selectedEvent.value.id)
    selectedEventTickets.value = response.data.data.sort((first, second) => {
      if (Boolean(first.checkedInAt) !== Boolean(second.checkedInAt)) {
        return first.checkedInAt ? 1 : -1
      }

      return first.attendeeName.localeCompare(second.attendeeName)
    })
  } catch (error) {
    selectedEventTickets.value = []
    result.value = {
      status: 'invalid',
      message: error.response?.data?.error?.message || 'Unable to load issued tickets from backend.',
      ticket: null,
    }
  }
}

watch(selectedEventId, async (eventId) => {
  if (eventId && eventId !== route.params.eventId) {
    router.replace({ name: 'organiser-check-in', params: { eventId } })
  }
  await loadSelectedEventTickets()
})

async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.value = 'Camera access is unavailable on this device. Enter the ticket code manually.'
    return
  }

  try {
    stopScanner()
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
    videoRef.value.srcObject = scannerStream
    await videoRef.value.play()
    scannerActive.value = true
    cameraMessage.value = 'Scanning QR ticket. Hold the code inside the frame.'
    scanQrLoop()
  } catch {
    cameraMessage.value = 'Camera permission was denied. Enter the ticket code manually.'
  }
}

function scanQrLoop() {
  if (!scannerActive.value || !videoRef.value) return

  try {
    const video = videoRef.value

    if (video.readyState >= 2 && scannerContext) {
      const width = video.videoWidth
      const height = video.videoHeight

      if (width > 0 && height > 0) {
        scannerCanvas.width = width
        scannerCanvas.height = height
        scannerContext.drawImage(video, 0, 0, width, height)

        const imageData = scannerContext.getImageData(0, 0, width, height)
        const qrCode = jsQR(imageData.data, width, height, {
          inversionAttempts: 'attemptBoth',
        })

        if (qrCode?.data) {
          const ticketPayload = qrCode.data
          stopScanner()
          cameraMessage.value = 'QR ticket captured. Result is shown on the right.'
          processTicketCode(ticketPayload)
          return
        }
      }
    }
  } catch {
    cameraMessage.value = 'Unable to read the QR code yet. Keep the ticket inside the frame or enter the code manually.'
  }

  scannerFrame = requestAnimationFrame(scanQrLoop)
}

function stopScanner() {
  if (scannerFrame) {
    cancelAnimationFrame(scannerFrame)
    scannerFrame = 0
  }

  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop())
    scannerStream = null
  }

  scannerActive.value = false
}

function submitManualCode() {
  processTicketCode(manualCode.value)
}

function useTicketCode(ticketCode) {
  manualCode.value = ticketCode
  processTicketCode(ticketCode)
}

async function processTicketCode(ticketCode) {
  if (!selectedEvent.value) {
    result.value = {
      status: 'invalid',
      message: 'Select an event before checking in tickets.',
      ticket: null,
    }
    return
  }

  try {
    const response = await checkInTicketApi({
      eventId: selectedEvent.value.id,
      code: ticketCode,
      method: ticketCode.trim().startsWith('{') ? 'qr_scan' : 'manual_entry',
    })
    result.value = response.data.data
    await loadSelectedEventTickets()
  } catch (error) {
    result.value = error.response?.data?.data || {
      status: 'invalid',
      message: error.response?.data?.error?.message || 'Unable to check in this ticket.',
      ticket: null,
    }
  } finally {
    manualCode.value = ''
  }
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

onUnmounted(() => {
  stopScanner()
})
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

.scanner-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.72;
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

.issued-ticket-panel {
  display: grid;
  gap: 14px;
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid #e2e8f0;
}

.issued-ticket-heading,
.issued-ticket-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.issued-ticket-heading span {
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.issued-ticket-heading h2 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 1.15rem;
}

.issued-ticket-heading small,
.issued-ticket-row small,
.issued-ticket-empty {
  color: #64748b;
}

.issued-ticket-list {
  display: grid;
  gap: 10px;
}

.issued-ticket-row {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
}

.issued-ticket-row > div {
  display: grid;
  min-width: 170px;
}

.issued-ticket-row strong {
  color: #0f172a;
}

.issued-ticket-row code {
  padding: 8px 10px;
  border-radius: 10px;
  color: #312e81;
  background: #eef2ff;
  font-weight: 900;
}

.issued-ticket-row span {
  color: #b45309;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.issued-ticket-row.checked {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.issued-ticket-row.checked span {
  color: #047857;
}

.issued-ticket-row button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.issued-ticket-empty {
  margin: 0;
  padding: 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
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

  .issued-ticket-heading,
  .issued-ticket-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
