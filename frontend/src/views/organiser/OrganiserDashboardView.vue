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

const tabs = [
  { key: 'events', label: 'Events' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'feedback', label: 'Feedback' },
]

const currentTab = ref('events')
const societyEvents = ref(defaultEvents)

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
</script>