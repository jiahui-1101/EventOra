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
            <p>From 0 responses</p>
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
                    <router-link :to="`/organiser/event-detail/${ev.id}`" style="font-weight:700;color:var(--text);text-decoration:none;">
                      {{ ev.title }}
                    </router-link>
                    <br />
                    <span :class="['badge', ev.category === 'Sports' ? 'badge-yellow' : 'badge-blue']" style="font-size:0.68rem;margin-top:6px;">
                      {{ ev.category || 'Academic' }}
                    </span>
                  </td>
                  <td>
                    {{ ev.eventDate || 'Not set' }}
                    <br />
                    <span style="color:var(--muted);font-size:0.78rem;">{{ ev.startTime || '--' }} - {{ ev.endTime || '--' }}</span>
                  </td>
                  <td>{{ ev.capacity }}</td>
                  <td>
                    {{ ev.registrations }}
                    <span style="color:var(--muted);font-size:0.78rem;">({{ ev.capacity ? Math.round((ev.registrations / ev.capacity) * 100) : 0 }}%)</span>
                  </td>
                  <td><span :class="['badge', badgeForStatus(ev.status)]">{{ statusLabel(ev.status) }}</span></td>
                  <td><router-link :to="`/organiser/event-detail/${ev.id}`" class="button button-secondary">Edit</router-link></td>
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

      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'

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

const tabs = [
  { key: 'events', label: 'Events' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'feedback', label: 'Feedback' },
]

const currentTab = ref('events')
const societyEvents = ref(defaultEvents)

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
</script>