<template>
  <main class="app-shell">
    <div class="dashboard-layout">

      <aside class="sidebar-nav">
        <a
          v-for="tab in tabs"
          :key="tab.key"
          href="#"
          :class="{ active: currentTab === tab.key }"
          @click.prevent="currentTab = tab.key"
        >
          {{ tab.label }}
        </a>
      </aside>

      <div class="dashboard-main">

                <div class="od-stats-grid">
          <article class="od-stat-card">
            <span>Total Events</span>
            <strong>{{ totalEvents }}</strong>
            <p>{{ publishedCount }} published · {{ pendingCount }} pending</p>
          </article>
          <article class="od-stat-card">
            <span>Total Registrations</span>
            <strong>{{ totalRegistrations }}</strong>
            <p>Across all events</p>
          </article>
          <article class="od-stat-card">
            <span>Total Attendance</span>
            <strong>{{ totalCheckedIn }}</strong>
            <p>{{ attendanceRate }}% attendance rate</p>
          </article>
          <article class="od-stat-card">
            <span>Avg. Feedback Rating</span>
            <strong>{{ avgRating }} ★</strong>
            <p>From {{ feedbackData.length }} responses</p>
          </article>
        </div>

                <div v-if="currentTab === 'events'" class="page-section">
          <div class="section-heading">
            <h2>My Events</h2>
            <router-link to="/organiser/create-event" class="button button-primary">
              + Create Event
            </router-link>
          </div>

          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Capacity</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ev in societyEvents" :key="ev.id">
                  <td>
                    <router-link
                      :to="`/organiser/event-detail/${ev.id}`"
                      style="font-weight:700;color:var(--text);text-decoration:none;"
                    >
                      {{ ev.title }}
                    </router-link>
                    <br />
                    <span
                      :class="['badge', ev.category === 'Sports' ? 'badge-yellow' : 'badge-blue']"
                      style="font-size:0.68rem;margin-top:6px;"
                    >
                      {{ ev.category || 'Academic' }}
                    </span>
                  </td>
                  <td>
                    {{ ev.eventDate || 'Not set' }}
                    <br />
                    <span style="color:var(--muted);font-size:0.78rem;">
                      {{ ev.startTime || '--' }} - {{ ev.endTime || '--' }}
                    </span>
                  </td>
                  <td>{{ ev.capacity }}</td>
                  <td>
                    {{ ev.registrations }}
                    <span style="color:var(--muted);font-size:0.78rem;">
                      ({{ ev.capacity ? Math.round((ev.registrations / ev.capacity) * 100) : 0 }}%)
                    </span>
                  </td>
                  <td>
                    <span :class="['badge', badgeForStatus(ev.status)]">{{ statusLabel(ev.status) }}</span>
                  </td>
                  <td>
                    <router-link :to="`/organiser/event-detail/${ev.id}`" class="button button-secondary">
                      Edit
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

                <div v-if="currentTab === 'registrations'" class="page-section">
          <div class="section-heading">
            <h2>Registrations</h2>
            <button class="button button-primary" @click="exportCSV(registrationsList, 'registrations.csv')">
              Export CSV
            </button>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Ticket Code</th></tr></thead>
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
        </div>

                <div v-if="currentTab === 'attendance'" class="page-section">
          <div class="section-heading">
            <div>
              <h2>Attendance Report</h2>
              <p style="color:var(--muted);margin:4px 0 0;">
                {{ attendanceList.length }} / {{ confirmedRegistrations }} confirmed attendees checked in
              </p>
            </div>
            <button class="button button-primary" @click="exportCSV(attendanceList, 'attendance.csv')">
              Export Attendance CSV
            </button>
          </div>
          <div class="capacity-bar" style="margin-bottom:1rem;">
            <span :style="{ width: attendanceTabRate + '%' }"></span>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Attendee</th><th>Checked In At</th><th>Verified By</th></tr></thead>
              <tbody>
                <tr v-for="a in attendanceList" :key="a.attendee">
                  <td>{{ a.attendee }}</td>
                  <td>{{ a.checkedInAt }}</td>
                  <td>{{ a.verifiedBy }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

                <div v-if="currentTab === 'feedback'" class="page-section">
          <div class="section-heading">
            <div>
              <h2>Feedback & Ratings</h2>
              <p style="color:var(--muted);margin:4px 0 0;">
                Average Rating: <strong>{{ avgRating }} / 5</strong> from {{ feedbackData.length }} reviews
              </p>
            </div>
            <button class="button button-primary" @click="exportCSV(feedbackData, 'feedback.csv')">
              Export Feedback CSV
            </button>
          </div>
          <!-- Chart.js draws onto this single canvas element. The
               v-if on the parent div means this canvas only exists in
               the DOM while this tab is active - that's exactly why the
               watch(currentTab, ...) below has to redraw on every
               re-entry into this tab, not just on first page load. -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;margin-bottom:1.25rem;height:260px;">
            <canvas ref="feedbackChartCanvas"></canvas>
          </div>
          <div class="event-grid">
            <article v-for="(f, idx) in feedbackData" :key="idx" class="event-card">
              <div class="event-card-body">
                <strong>{{ '★'.repeat(f.rating) }}{{ '☆'.repeat(5 - f.rating) }}</strong>
                <p>{{ f.comment }}</p>
              </div>
            </article>
          </div>
        </div>

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
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'

// Chart.js v4 is "tree-shakeable" - it does NOT auto-register every chart
// type/scale like v2 did. If you skip this line, the bar chart silently
// fails to render with no console error, which is a classic gotcha.
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const route = useRoute()
const router = useRouter()

const eventsStorageKey = 'eventora_society_events_v2'

const defaultEvents = [
  {
    id: 1, title: 'Build Your First AI App', category: 'Academic', location: 'N28A Innovation Lab',
    eventDate: '12 Jun 2026', startTime: '7:30 PM', endTime: '9:30 PM',
    feeType: 'Paid', feeAmount: 8, status: 'published',
    registrations: 28, checkedIn: 18, avgRating: 4.5, capacity: 40,
  },
  {
    id: 2, title: 'Hackathon 2026', category: 'Academic', location: 'FAB Lab',
    eventDate: '5 Jul 2026', startTime: '9:00 AM', endTime: '6:00 PM',
    feeType: 'Paid', feeAmount: 15, status: 'pending_approval',
    registrations: 0, checkedIn: 0, avgRating: null, capacity: 60,
  },
  {
    id: 3, title: 'Futsal Tournament', category: 'Sports', location: 'UTM Sports Hall',
    eventDate: '28 Jun 2026', startTime: '9:00 AM', endTime: '1:00 PM',
    feeType: 'Free', feeAmount: 0, status: 'published',
    registrations: 40, checkedIn: 32, avgRating: 4.2, capacity: 40,
  },
]

const registrationsList = [
  { name: 'Aina Rahman', email: 'aina@utm.my', status: 'confirmed', ticketCode: 'EVT-9F4K-2Q8M-X7P1' },
  { name: 'Nurul Iman', email: 'nurul@utm.my', status: 'confirmed', ticketCode: 'EVT-3H7J-1L9N-P5R2' },
  { name: 'Kevin Tan', email: 'kevin@utm.my', status: 'waitlist', ticketCode: '' },
]

const attendanceList = [
  { attendee: 'Aina Rahman', checkedInAt: '7:18 PM, 12 Jun', verifiedBy: 'Mei Shuet' },
  { attendee: 'Nurul Iman', checkedInAt: '7:22 PM, 12 Jun', verifiedBy: 'Mei Shuet' },
]

const feedbackData = [
  { rating: 5, comment: 'Excellent workshop!' },
  { rating: 4, comment: 'Good but short' },
  { rating: 5, comment: 'Very inspiring' },
]

// Rubric target: "Organiser Dashboard with Chart.js feedback stats and
// ratings" (PR1 Role Split). This computed turns the flat feedbackData
// array into a 5-bucket count, e.g. how many people gave 1 star, how
// many gave 2 stars, etc. Chart.js needs data already shaped into
// "labels" + "values" arrays - it won't do the counting for you.
const ratingDistribution = computed(() => {
  const counts = [0, 0, 0, 0, 0] // index 0 = 1 star ... index 4 = 5 stars
  feedbackData.forEach((f) => {
    if (f.rating >= 1 && f.rating <= 5) counts[f.rating - 1] += 1
  })
  return counts
})

// This <canvas> ref is how Vue hands Chart.js a raw DOM element to draw
// on. Chart.js itself has no idea Vue exists - it just needs a canvas.
const feedbackChartCanvas = ref(null)
let feedbackChartInstance = null

function renderFeedbackChart() {
  // Guard: the canvas only exists in the DOM while the Feedback tab is
  // active (because of v-if="currentTab === 'feedback'" in the template).
  // If we try to draw before it exists, Chart.js throws.
  if (!feedbackChartCanvas.value) return

  // If a chart was already drawn on this canvas before (e.g. user left
  // the tab and came back), destroy the old instance first. Chart.js
  // does not auto-clean-up - skipping this causes a memory leak and
  // visual glitches where the old chart and new chart overlap.
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
          ticks: { stepSize: 1 }, // counts are whole numbers, no "1.5 responses"
        },
      },
    },
  })
}

const tabs = [
  { key: 'events', label: 'Events' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'feedback', label: 'Feedback' },
]

const currentTab = ref('events')

// This watch must come AFTER currentTab is declared above (const is not
// hoisted the way function declarations are - referencing it earlier
// throws "Cannot access before initialization"). It fires every time the
// organiser switches tabs. Because the canvas is wrapped in v-if, Vue
// destroys/recreates it every time the tab switches, so the chart must
// be redrawn every time "feedback" becomes active, not just once on
// page load.
watch(currentTab, async (tab) => {
  if (tab === 'feedback') {
    // nextTick waits for Vue to actually finish inserting the <canvas>
    // into the DOM (because of v-if) before we try to draw on it.
    await nextTick()
    renderFeedbackChart()
  }
})

const societyEvents = ref(
  JSON.parse(localStorage.getItem(eventsStorageKey) || 'null') || defaultEvents
)

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

// ===== Stats (computed) =====
const totalEvents = computed(() => societyEvents.value.length)
const publishedCount = computed(() => societyEvents.value.filter((ev) => ev.status === 'published').length)
const pendingCount = computed(() => societyEvents.value.filter((ev) => ev.status === 'pending_approval').length)
const totalRegistrations = computed(() => societyEvents.value.reduce((sum, ev) => sum + ev.registrations, 0))
const totalCheckedIn = computed(() => societyEvents.value.reduce((sum, ev) => sum + ev.checkedIn, 0))
const attendanceRate = computed(() =>
  totalRegistrations.value ? Math.round((totalCheckedIn.value / totalRegistrations.value) * 100) : 0
)
const avgRating = computed(() => {
  const ratings = societyEvents.value.filter((ev) => ev.avgRating).map((ev) => ev.avgRating)
  if (!ratings.length) return '0.0'
  return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
})

const confirmedRegistrations = computed(
  () => registrationsList.filter((r) => r.status === 'confirmed').length
)
const attendanceTabRate = computed(() =>
  confirmedRegistrations.value ? Math.round((attendanceList.length / confirmedRegistrations.value) * 100) : 0
)

// ===== CSV export =====
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

// ===== Toast from query params (after teammate's create-event flow redirects back) =====
const toast = reactive({ visible: false, title: '', message: '' })

function showCreateEventToast() {
  const eventSaved = route.query.eventSaved
  const eventAction = route.query.eventAction
  if (!eventSaved && !eventAction) return

  if (eventSaved === 'draft') {
    toast.title = 'Draft saved successfully'
    toast.message = 'The event is saved as a draft and can be edited before submission.'
    addCreatedEventToDashboard('draft')
  }
  if (eventSaved === 'submitted') {
    toast.title = 'Event submitted for approval'
    toast.message = 'Faculty Admin will review the event before it appears in the public list.'
    addCreatedEventToDashboard('pending_approval')
  }
  if (eventAction === 'submitted') {
    toast.title = 'Event submitted for approval'
    toast.message = 'The event moved from draft to pending approval for Faculty Admin review.'
  }
  if (eventAction === 'deleted') {
    toast.title = 'Draft deleted'
    toast.message = 'The draft event has been removed from the organiser workspace.'
  }

  toast.visible = true
  setTimeout(() => {
    toast.visible = false
    router.replace({ path: route.path })
  }, 3500)
}

function addCreatedEventToDashboard(status) {
  const mockId = 'created-event-annual-tech-symposium'
  const alreadyAdded = societyEvents.value.some((ev) => ev.mockId === mockId)
  if (alreadyAdded) return

  societyEvents.value.unshift({
    id: Date.now(),
    mockId,
    title: 'Annual Tech Symposium 2026',
    category: 'Academic',
    location: 'Dewan Sultan Iskandar, UTM JB',
    eventDate: '15 Jul 2026',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    feeType: 'Free',
    feeAmount: 0,
    status,
    registrations: 0,
    checkedIn: 0,
    avgRating: null,
    capacity: 120,
  })
  saveEvents()
}

onMounted(() => {
  showCreateEventToast()
})
</script>