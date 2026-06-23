<template>
  <main class="app-shell organiser-shell">
    <section class="organiser-hero">
      <router-link
        to="/notifications"
        class="dashboard-notification-button"
        aria-label="Notifications"
        title="Notifications"
      >
        🔔
        <span
          v-if="unreadCount > 0"
          class="notification-dot"
        ></span>
      </router-link>

      <div>
        <p class="eyebrow">Organiser Workspace</p>
        <h1>Organiser Dashboard</h1>
        <p>Computer Society UTM · Manage events, registrations, attendance and feedback.</p>
      </div>
    </section>

    <div class="organiser-layout">
      <aside class="organiser-sidebar">
        <div class="sidebar-title">
          <span class="brand-dot">E</span>
          <div>
            <strong>EventOra</strong>
            <small>Society tools</small>
          </div>
        </div>

        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="['sidebar-link', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </aside>

      <div class="organiser-main">
        <div class="od-stats-grid redesigned-stats">
          <article class="od-stat-card stat-accent-purple">
            <span>Total Events</span>
            <strong>{{ totalEvents }}</strong>
            <p>{{ publishedCount }} published · {{ pendingCount }} pending</p>
          </article>

          <article class="od-stat-card stat-accent-blue">
            <span>Total Registrations</span>
            <strong>{{ totalRegistrations }}</strong>
            <p>Across all events</p>
          </article>

          <article class="od-stat-card stat-accent-green">
            <span>Total Attendance</span>
            <strong>{{ totalCheckedIn }}</strong>
            <p>{{ attendanceRate }}% attendance rate</p>
          </article>

          <article class="od-stat-card stat-accent-yellow">
            <span>Avg. Feedback Rating</span>
            <strong>{{ avgRating }} ★</strong>
            <p>From {{ feedbackData.length }} responses</p>
          </article>
        </div>

        <section v-if="currentTab === 'events'" class="page-section organiser-panel">
          <div class="section-heading organiser-panel-heading">
            <div>
              <p class="eyebrow">Events</p>
              <h2>My Events</h2>
              <p class="panel-subtitle">Track event status, capacity and registration progress.</p>
            </div>

            <router-link to="/organiser/create-event" class="button button-primary">
              + Create Event
            </router-link>
          </div>

          <div class="event-card-list">
            <article v-for="ev in societyEvents" :key="ev.id" class="organiser-event-card">
              <div class="event-main">
                <span :class="['badge', ev.category === 'Sports' ? 'badge-yellow' : 'badge-blue']">
                  {{ ev.category || 'Academic' }}
                </span>

                <router-link :to="`/organiser/event-detail/${ev.id}`" class="event-title-link">
                  {{ ev.title }}
                </router-link>

                <p>{{ ev.location || 'Venue not set' }}</p>
              </div>

              <div class="event-info">
                <span>Date</span>
                <strong>{{ ev.eventDate || 'Not set' }}</strong>
                <small>{{ ev.startTime || '--' }} - {{ ev.endTime || '--' }}</small>
              </div>

              <div class="event-info">
                <span>Capacity</span>
                <strong>{{ ev.capacity }}</strong>
                <small>{{ ev.registrations }} registered</small>
              </div>

              <div class="event-progress">
                <div>
                  <span>Registration</span>
                  <strong>{{ registrationPercent(ev) }}%</strong>
                </div>
                <div class="capacity-bar mini-progress">
                  <span :style="{ width: registrationPercent(ev) + '%' }"></span>
                </div>
              </div>

              <div class="event-actions">
                <span :class="['badge', badgeForStatus(ev.status)]">
                  {{ statusLabel(ev.status) }}
                </span>
                <router-link :to="`/organiser/event-detail/${ev.id}`" class="button button-secondary">
                  Edit
                </router-link>
              </div>
            </article>
          </div>
        </section>

        <section v-if="currentTab === 'registrations'" class="page-section organiser-panel">
          <div class="section-heading organiser-panel-heading">
            <div>
              <p class="eyebrow">Registrations</p>
              <h2>Participant List</h2>
              <p class="panel-subtitle">View confirmed and waitlisted participants.</p>
            </div>
            <button class="button button-primary" @click="exportCSV(registrationsList, 'registrations.csv')">
              Export CSV
            </button>
          </div>

          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Ticket Code</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in registrationsList" :key="r.email">
                  <td>{{ r.name }}</td>
                  <td>{{ r.email }}</td>
                  <td>
                    <span :class="['badge', r.status === 'confirmed' ? 'badge-green' : 'badge-yellow']">
                      {{ r.status }}
                    </span>
                  </td>
                  <td><code>{{ r.ticketCode || '-' }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="currentTab === 'attendance'" class="page-section organiser-panel">
          <div class="section-heading organiser-panel-heading">
            <div>
              <p class="eyebrow">Attendance</p>
              <h2>Attendance Report</h2>
              <p class="panel-subtitle">
                {{ attendanceList.length }} / {{ confirmedRegistrations }} confirmed attendees checked in
              </p>
            </div>
            <button class="button button-primary" @click="exportCSV(attendanceList, 'attendance.csv')">
              Export Attendance CSV
            </button>
          </div>

          <div class="capacity-bar attendance-progress">
            <span :style="{ width: attendanceTabRate + '%' }"></span>
          </div>

          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Checked In At</th>
                  <th>Verified By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in attendanceList" :key="a.attendee">
                  <td>{{ a.attendee }}</td>
                  <td>{{ a.checkedInAt }}</td>
                  <td>{{ a.verifiedBy }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="currentTab === 'feedback'" class="page-section organiser-panel">
          <div class="section-heading organiser-panel-heading">
            <div>
              <p class="eyebrow">Feedback</p>
              <h2>Feedback & Ratings</h2>
              <p class="panel-subtitle">
                Average Rating: <strong>{{ liveAvgRating }} / 5</strong> from {{ feedbackData.length }} reviews
              </p>
            </div>
            <button class="button button-primary" @click="exportCSV(feedbackData, 'Feedback_Report_UTM.csv')">
              Export Feedback CSV
            </button>
          </div>

          <div class="chart-card">
            <canvas ref="feedbackChartCanvas"></canvas>
          </div>

          <div class="event-grid">
            <article v-for="(f, idx) in feedbackData" :key="idx" class="event-card feedback-card">
              <div class="event-card-body">
                <strong style="color: #f59e0b; font-size: 1.1rem;">{{ '★'.repeat(f.rating) }}{{ '☆'.repeat(5 - f.rating) }}</strong>
                <p style="margin-top: 6px; color: #334155;">"{{ f.comment }}"</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="toast.visible"
      class="registration-alert"
      style="display:block;position:fixed;right:24px;bottom:24px;z-index:1200;max-width:340px;box-shadow:var(--shadow-lg);"
    >
      <strong>{{ toast.title }}</strong>
      <p>{{ toast.message }}</p>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loadNotifications as loadStoredNotifications } from '@/stores/notifications'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const eventsStorageKey = 'eventora_society_events_v2'

const registrationsList = [
  { name: 'Aina Rahman', email: 'aina@utm.my', status: 'confirmed', ticketCode: 'EVT-9F4K-2Q8M-X7P1' },
  { name: 'Nurul Iman', email: 'nurul@utm.my', status: 'confirmed', ticketCode: 'EVT-3H7J-1L9N-P5R2' },
  { name: 'Kevin Tan', email: 'kevin@utm.my', status: 'waitlist', ticketCode: '' },
]

const attendanceList = [
  { attendee: 'Aina Rahman', checkedInAt: '7:18 PM, 12 Jun', verifiedBy: 'Mei Shuet' },
  { attendee: 'Nurul Iman', checkedInAt: '7:22 PM, 12 Jun', verifiedBy: 'Mei Shuet' },
]

const fbKey = 'eventora_feedbacks_v2'
const baseFeedbackList = [
  { rating: 5, comment: 'Excellent practical session! Highly recommended.' },
  { rating: 4, comment: 'Great content, but the lab AC was way too cold.' },
  { rating: 5, comment: 'The speaker explained complex algorithms very clearly.' }
]

const feedbackData = computed(() => {
  const local = JSON.parse(localStorage.getItem(fbKey) || '[]')
  const formattedLocal = local.map(item => ({
    rating: Number(item.rating) || 5,
    comment: item.comment || 'No comment text provided.'
  }))
  return [...formattedLocal, ...baseFeedbackList]
})

const liveAvgRating = computed(() => {
  const list = feedbackData.value
  if (!list.length) return '0.0'
  const sum = list.reduce((acc, curr) => acc + curr.rating, 0)
  return (sum / list.length).toFixed(1)
})

const ratingDistribution = computed(() => {
  const counts = [0, 0, 0, 0, 0]
  
  feedbackData.value.forEach((f) => {
    if (f.rating >= 1 && f.rating <= 5) counts[f.rating - 1] += 1
  })
  return counts
})

const feedbackChartCanvas = ref(null)
let feedbackChartInstance = null

function renderFeedbackChart() {
  if (!feedbackChartCanvas.value) return

  if (feedbackChartInstance) {
    feedbackChartInstance.destroy()
  }

  feedbackChartInstance = new Chart(feedbackChartCanvas.value, {
    type: 'bar',
    data: {
      labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
      datasets: [
        {
          label: 'Number of responses',
          data: ratingDistribution.value,
          backgroundColor: '#6366f1',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  })
}

const tabs = [
  { key: 'events', label: 'Events', icon: 'EV' },
  { key: 'registrations', label: 'Registrations', icon: 'RG' },
  { key: 'attendance', label: 'Attendance', icon: 'AT' },
  { key: 'feedback', label: 'Feedback', icon: 'FB' },
]

const currentTab = ref('events')
const notifications = ref([])

watch(currentTab, async (tab) => {
  if (tab === 'feedback') {
    await nextTick()
    renderFeedbackChart()
  }
})

const societyEvents = ref([])

function saveEvents() {
  localStorage.setItem(eventsStorageKey, JSON.stringify(societyEvents.value))
}

function badgeForStatus(status) {
  if (status === 'published') return 'badge-green'
  if (status === 'pending_approval') return 'badge-yellow'
  if (status === 'completed') return 'badge-purple'
  if (status === 'rejected' || status === 'cancelled') return 'badge-red'
  return 'badge-blue'
}

function statusLabel(status) {
  return status.replace('_', ' ')
}

function registrationPercent(event) {
  return event.capacity ? Math.round((event.registrations / event.capacity) * 100) : 0
}

const totalEvents = computed(() => societyEvents.value.length)
const publishedCount = computed(() => societyEvents.value.filter((ev) => ev.status === 'published').length)
const pendingCount = computed(() => societyEvents.value.filter((ev) => ev.status === 'pending_approval').length)
const totalRegistrations = computed(() => societyEvents.value.reduce((sum, ev) => sum + ev.registrations, 0))
const totalCheckedIn = computed(() => societyEvents.value.reduce((sum, ev) => sum + ev.checkedIn, 0))
const attendanceRate = computed(() =>
  totalRegistrations.value ? Math.round((totalCheckedIn.value / totalRegistrations.value) * 100) : 0
)

const confirmedRegistrations = computed(
  () => registrationsList.filter((r) => r.status === 'confirmed').length
)
const attendanceTabRate = computed(() =>
  confirmedRegistrations.value ? Math.round((attendanceList.length / confirmedRegistrations.value) * 100) : 0
)

const unreadCount = computed(() =>
  notifications.value.filter(
    (notification) => notification.audience === authStore.role && notification.unread
  ).length
)

function escapeCsv(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function exportCSV(rows, filename) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const toast = reactive({ visible: false, title: '', message: '' })

function showCreateEventToast() {
  const eventSaved = route.query.eventSaved
  const eventAction = route.query.eventAction
  if (!eventSaved && !eventAction) return

  if (eventSaved === 'draft') {
    toast.title = 'Draft saved successfully'
    toast.message = 'The event is saved as a draft and can be edited before submission.'
  }

  if (eventSaved === 'submitted') {
    toast.title = 'Event submitted for approval'
    toast.message = 'Faculty Admin will review the event before it appears in the public list.'
  }

  if (eventAction === 'submitted') {
    toast.title = 'Event submitted for approval'
    toast.message = 'The event moved from draft to pending approval for Faculty Admin review.'
  }

  if (eventAction === 'deleted') {
    toast.title = 'Draft deleted'
    toast.message = 'The draft event has been removed from the organiser workspace.'
  }

  if (eventAction === 'submission_cancelled') {
    toast.title = 'Submission cancelled'
    toast.message = 'The event is back to draft and can be edited before resubmission.'
  }

  if (eventAction === 'cancelled') {
    toast.title = 'Event cancelled'
    toast.message = 'The published event has been cancelled and hidden from student registration.'
  }

  toast.visible = true
  setTimeout(() => {
    toast.visible = false
    router.replace({ path: route.path })
  }, 3500)
}

function normaliseEvent(rawEvent) {
  const start = rawEvent.startAt ? new Date(rawEvent.startAt) : null
  const end = rawEvent.endAt ? new Date(rawEvent.endAt) : null
  const category = rawEvent.category
    ? rawEvent.category.charAt(0).toUpperCase() + rawEvent.category.slice(1)
    : 'Academic'

  return {
    id: rawEvent.id,
    title: rawEvent.title,
    category,
    location: rawEvent.location || rawEvent.venue || 'Venue not set',
    description: rawEvent.description || '',
    eventDate: rawEvent.eventDate || (start ? formatDateOnly(start) : 'Not set'),
    startTime: rawEvent.startTime || (start ? formatTimeOnly(start) : '--'),
    endTime: rawEvent.endTime || (end ? formatTimeOnly(end) : '--'),
    registrationDeadline: rawEvent.registrationDeadline || '',
    feeType: rawEvent.feeType || (rawEvent.priceType === 'paid' ? 'Paid' : 'Free'),
    feeAmount: rawEvent.feeAmount ?? rawEvent.price ?? 0,
    status: rawEvent.status === 'pending' ? 'pending_approval' : rawEvent.status || 'draft',
    registrations: rawEvent.registrations ?? rawEvent.confirmedCount ?? 0,
    checkedIn: rawEvent.checkedIn ?? Math.round((rawEvent.confirmedCount ?? 0) * 0.74),
    avgRating: rawEvent.avgRating ?? null,
    capacity: rawEvent.capacity ?? 0,
    coverClass: rawEvent.coverClass,
    badgeClass: rawEvent.badgeClass,
  }
}

function formatDateOnly(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeOnly(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function loadSocietyEvents() {
  try {
    const response = await fetch('/mock/events.json')

    if (!response.ok) return

    const seedEvents = (await response.json()).map(normaliseEvent)
    const savedEvents = JSON.parse(localStorage.getItem(eventsStorageKey) || 'null')

    if (Array.isArray(savedEvents)) {
      const savedEventsById = new Map(savedEvents.map((event) => [String(event.id), event]))
      const mergedSeedEvents = seedEvents.map((event) => ({
        ...event,
        ...savedEventsById.get(String(event.id)),
      }))
      const customEvents = savedEvents.filter(
        (event) => !seedEvents.some((seedEvent) => String(seedEvent.id) === String(event.id))
      )

      societyEvents.value = [...customEvents, ...mergedSeedEvents]
      return
    }

    societyEvents.value = seedEvents
    saveEvents()
  } catch (error) {
    societyEvents.value = []
  }
}

async function loadNotifications() {
  try {
    notifications.value = await loadStoredNotifications()
  } catch (error) {
    notifications.value = []
  }
}

onMounted(async () => {
  await loadSocietyEvents()
  loadNotifications()
  showCreateEventToast()
})
</script>

<style scoped>
.organiser-shell {
  width: min(1180px, calc(100% - 32px));
  padding-top: 24px;
}

.organiser-hero {
  position: relative;
  margin-bottom: 20px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  box-shadow: var(--shadow);
}

.organiser-hero h1 {
  margin: 6px 0;
  font-size: 1.8rem;
  letter-spacing: -0.03em;
}

.dashboard-notification-button {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--text);
  text-decoration: none;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  font-size: 1.1rem;
  z-index: 3;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-notification-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.notification-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--danger);
  border: 2px solid #fff;
}

.organiser-layout {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.organiser-sidebar {
  position: sticky;
  top: 84px;
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.sidebar-title {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 8px 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 6px;
}

.brand-dot {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--primary);
  color: white;
  font-weight: 800;
}

.sidebar-title strong,
.sidebar-title small {
  display: block;
}

.sidebar-title small {
  color: var(--muted);
  font-size: 0.76rem;
}

.sidebar-link {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.sidebar-link span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--surface-soft);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 900;
}

.sidebar-link.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
}

.sidebar-link.active span {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.organiser-main {
  min-width: 0;
}

.redesigned-stats {
  margin-bottom: 20px;
}

.redesigned-stats .od-stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
}

.redesigned-stats .od-stat-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--primary);
}

.stat-accent-blue::before {
  background: #3b82f6 !important;
}

.stat-accent-green::before {
  background: #10b981 !important;
}

.stat-accent-yellow::before {
  background: #f59e0b !important;
}

.organiser-panel {
  margin-top: 0;
}

.organiser-panel-heading {
  align-items: flex-start;
  margin-bottom: 16px;
}

.panel-subtitle {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.88rem;
}

.event-card-list {
  display: grid;
  gap: 12px;
}

.organiser-event-card {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) 150px 120px 170px 110px;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
}

.event-title-link {
  display: block;
  margin: 8px 0 4px;
  color: var(--text);
  font-weight: 800;
  text-decoration: none;
}

.event-main p,
.event-info small {
  color: var(--muted);
  font-size: 0.8rem;
}

.event-info span,
.event-progress span {
  display: block;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
}

.event-info strong,
.event-progress strong {
  display: block;
  margin-top: 4px;
  color: var(--text);
}

.mini-progress {
  height: 7px;
  margin: 8px 0 0;
}

.event-actions {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.chart-card {
  height: 270px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  margin-bottom: 18px;
}

.feedback-card {
  border-radius: 16px;
}

.attendance-progress {
  margin-bottom: 18px;
}

@media (max-width: 980px) {
  .organiser-layout {
    grid-template-columns: 1fr;
  }

  .organiser-sidebar {
    position: static;
    display: flex;
    overflow-x: auto;
  }

  .sidebar-title {
    display: none;
  }

  .sidebar-link {
    white-space: nowrap;
  }

  .organiser-event-card {
    grid-template-columns: 1fr;
  }

  .event-actions {
    justify-items: start;
  }
}

@media (max-width: 640px) {
  .organiser-hero,
  .organiser-panel-heading {
    display: block;
  }

  .organiser-panel-heading .button {
    margin-top: 14px;
  }
}
</style>
