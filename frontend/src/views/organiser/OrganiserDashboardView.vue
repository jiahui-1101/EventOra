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
        {{ filteredAttendanceList.length }} checked-in record(s) shown
      </p>
    </div>

    <button
      class="button button-primary"
      @click="exportCSV(filteredAttendanceList, 'attendance.csv')"
    >
      Export Attendance CSV
    </button>
  </div>

  <div class="report-filter">
    <label>
      Filter by event
      <select v-model="selectedReportEvent">
        <option value="all">All completed events</option>
        <option
          v-for="event in reportEventOptions"
          :key="event.id"
          :value="event.id"
        >
          {{ event.title }}
        </option>
      </select>
    </label>
  </div>

  <div class="capacity-bar attendance-progress">
    <span :style="{ width: filteredAttendanceTabRate + '%' }"></span>
  </div>

  <div class="admin-table-wrap">
    <table class="admin-table">
      <thead>
        <tr>
          <th>Attendee</th>
          <th>Event</th>
          <th>Checked In At</th>
          <th>Verified By</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="a in filteredAttendanceList"
          :key="`${a.event}-${a.attendee}`"
        >
          <td>{{ a.attendee }}</td>
          <td>{{ a.event }}</td>
          <td>{{ a.checkedInAt }}</td>
          <td>{{ a.verifiedBy }}</td>
        </tr>

        <tr v-if="filteredAttendanceList.length === 0">
          <td colspan="4" style="text-align: center; color: var(--muted);">
            No attendance records found for this filter.
          </td>
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
        Average Rating:
        <strong>{{ filteredLiveAvgRating }} / 5</strong>
        from {{ filteredFeedbackData.length }} reviews
      </p>
    </div>

    <button
      class="button button-primary"
      @click="exportCSV(filteredFeedbackData, 'Feedback_Report_UTM.csv')"
    >
      Export Feedback CSV
    </button>
  </div>

  <div class="report-filter">
    <label>
      Filter by event
      <select v-model="selectedReportEvent">
        <option value="all">All completed events</option>
        <option
          v-for="event in reportEventOptions"
          :key="event.id"
          :value="event.id"
        >
          {{ event.title }}
        </option>
      </select>
    </label>
  </div>

  <div class="chart-card">
    <canvas ref="feedbackChartCanvas"></canvas>
  </div>

  <div class="event-grid">
    <article
      v-for="(f, idx) in filteredFeedbackData"
      :key="idx"
      class="event-card feedback-card"
    >
      <div class="event-card-body">
        <span class="event-date">{{ f.event }}</span>

        <strong style="color: #f59e0b; font-size: 1.1rem;">
          {{ '★'.repeat(f.rating) }}{{ '☆'.repeat(5 - f.rating) }}
        </strong>

        <p style="margin-top: 6px; color: #334155; white-space: pre-wrap;">
          {{ f.comment }}
        </p>

        <small v-if="f.submittedAt" style="color: var(--muted);">
          Submitted {{ f.submittedAt }}
        </small>
      </div>
    </article>

    <p
      v-if="filteredFeedbackData.length === 0"
      class="empty-state"
      style="grid-column: 1 / -1;"
    >
      No feedback found for this filter.
    </p>
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
import {
  getOrganiserAttendanceApi,
  getOrganiserDashboardApi,
  getOrganiserEventsApi,
  getOrganiserParticipantsApi,
  getOrganiserFeedbackApi,
} from '@/api/dashboard'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const dashboardParticipants = ref(null)
const dashboardAttendance = ref(null)
const dashboardFeedback = ref(null)

const selectedReportEvent = ref('all')

const reportEventOptions = computed(() => {
  const options = new Map()

  societyEvents.value
    .filter((event) => event.status === 'completed' || event.checkedIn > 0 || event.avgRating)
    .forEach((event) => {
      options.set(String(event.id), { id: String(event.id), title: event.title })
    })

  attendanceList.value.forEach((row) => {
    if (row.eventId) options.set(String(row.eventId), { id: String(row.eventId), title: row.event })
  })

  feedbackData.value.forEach((row) => {
    if (row.eventId) options.set(String(row.eventId), { id: String(row.eventId), title: row.event })
  })

  return [...options.values()]
})

const selectedReportEventTitle = computed(() => {
  const selected = reportEventOptions.value.find((event) => event.id === selectedReportEvent.value)
  return selected?.title || null
})

const filteredAttendanceList = computed(() => {
  if (selectedReportEvent.value === 'all') return attendanceList.value
  return attendanceList.value.filter(
    (row) => String(row.eventId) === selectedReportEvent.value
  )
})

const filteredFeedbackData = computed(() => {
  if (selectedReportEvent.value === 'all') return feedbackData.value
  return feedbackData.value.filter(
    (row) => String(row.eventId) === selectedReportEvent.value
  )
})

const filteredLiveAvgRating = computed(() => {
  const list = filteredFeedbackData.value
  if (!list.length) return '0.0'
  const sum = list.reduce((acc, curr) => acc + curr.rating, 0)
  return (sum / list.length).toFixed(1)
})

const filteredRatingDistribution = computed(() => {
  const counts = [0, 0, 0, 0, 0]

  filteredFeedbackData.value.forEach((f) => {
    if (f.rating >= 1 && f.rating <= 5) counts[f.rating - 1] += 1
  })

  return counts
})

const filteredConfirmedRegistrations = computed(() => {
  if (selectedReportEvent.value === 'all' || !selectedReportEventTitle.value) return confirmedRegistrations.value

  return registrationsList.value.filter(
    (registration) =>
      registration.status === 'confirmed' &&
      registration.event === selectedReportEventTitle.value
  ).length
})

const filteredAttendanceTabRate = computed(() =>
  filteredConfirmedRegistrations.value
    ? Math.round((filteredAttendanceList.value.length / filteredConfirmedRegistrations.value) * 100)
    : 0
)

const registrationsList = computed(() => {
  if (dashboardParticipants.value) return dashboardParticipants.value

  return []
})

const attendanceList = computed(() => {
  if (dashboardAttendance.value) return dashboardAttendance.value

  return []
})

const feedbackData = computed(() => {
  if (dashboardFeedback.value) return dashboardFeedback.value

  return []
})

const liveAvgRating = computed(() => {
  const list = feedbackData.value
  if (!list.length) return '0.0'
  const sum = list.reduce((acc, curr) => acc + curr.rating, 0)
  return (sum / list.length).toFixed(1)
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
          data: filteredRatingDistribution.value,
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

watch([currentTab, selectedReportEvent, filteredFeedbackData], async ([tab]) => {
  if (tab === 'feedback') {
    await nextTick()
    renderFeedbackChart()
  }
})

const societyEvents = ref([])

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

const dashboardStats = ref(null)

const dashboardEventTotals = computed(() => dashboardStats.value?.event_totals || {})
const totalEvents = computed(() =>
  dashboardStats.value ? dashboardStats.value.total_events ?? 0 : societyEvents.value.length
)
const publishedCount = computed(() =>
  dashboardStats.value
    ? dashboardEventTotals.value.published ?? 0
    : societyEvents.value.filter((ev) => ev.status === 'published').length
)
const pendingCount = computed(() =>
  dashboardStats.value
    ? dashboardEventTotals.value.pending_approval ?? 0
    : societyEvents.value.filter((ev) => ev.status === 'pending_approval').length
)
const totalRegistrations = computed(() => {
  if (dashboardStats.value) return dashboardStats.value.total_registrations ?? 0

  return 0
})
const totalCheckedIn = computed(() =>
  dashboardStats.value ? dashboardStats.value.attendance?.checked_in ?? 0 : attendanceList.value.length
)
const attendanceRate = computed(() => {
  if (dashboardStats.value) return Math.round(dashboardStats.value.attendance?.rate_percent ?? 0)
  return totalRegistrations.value ? Math.round((totalCheckedIn.value / totalRegistrations.value) * 100) : 0
})
const avgRating = computed(() => {
  const backendRating = dashboardStats.value?.average_rating
  if (backendRating === null || backendRating === undefined) return liveAvgRating.value

  const numericRating = Number(backendRating)
  return Number.isNaN(numericRating) ? '0.0' : numericRating.toFixed(1)
})

const confirmedRegistrations = computed(
  () => registrationsList.value.filter((r) => r.status === 'confirmed').length
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

  if (eventAction === 'completed') {
  toast.title = 'Event marked as completed'
  toast.message = 'Post-event feedback, certificates, and attendance export are now available.'
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
    checkedIn: rawEvent.checkedIn ?? 0,
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

function formatDateTime(dateValue) {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

async function loadSocietyEvents() {
  if (!localStorage.getItem('eventora_token')) {
    societyEvents.value = []
    return
  }

  try {
    const response = await getOrganiserEventsApi()
    societyEvents.value = response.data.data.map(normaliseEvent)
  } catch (error) {
    console.error('Failed to load organiser events from backend:', error)
    societyEvents.value = []
  }
}

async function loadDashboardStats() {
  if (!localStorage.getItem('eventora_token')) return

  try {
    const response = await getOrganiserDashboardApi()
    dashboardStats.value = response.data.data
  } catch (error) {
    dashboardStats.value = null
    console.error('Failed to load organiser dashboard stats from backend:', error)
  }
}

async function loadDashboardLists() {
  if (!localStorage.getItem('eventora_token')) return

  try {
    const [participantsResponse, attendanceResponse, feedbackResponse] = await Promise.all([
  getOrganiserParticipantsApi(),
  getOrganiserAttendanceApi(),
  getOrganiserFeedbackApi(),
])

dashboardFeedback.value = feedbackResponse.data.data.map((row) => ({
  ...row,
  submittedAt: row.submittedAt ? formatDateTime(row.submittedAt) : '',
}))
    dashboardParticipants.value = participantsResponse.data.data
    dashboardAttendance.value = attendanceResponse.data.data.map((row) => ({
      ...row,
      checkedInAt: row.checkedInAt ? formatDateTime(row.checkedInAt) : '-',
    }))
  } catch (error) {
    dashboardFeedback.value = []
    dashboardParticipants.value = []
    dashboardAttendance.value = []
    console.error('Failed to load organiser dashboard lists from backend:', error)
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
  await loadDashboardStats()
  await loadDashboardLists()
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

.report-filter {
  margin: 0 0 18px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
}

.report-filter label {
  display: grid;
  gap: 8px;
  max-width: 320px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.report-filter select {
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  color: var(--text);
  background: #fff;
  font: inherit;
  text-transform: none;
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
