<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Post-event records</p>
        <h1>Event Attendance</h1>
        <p v-if="attendance.eventTitle" class="page-subtitle">
          {{ attendance.eventTitle }}
        </p>
      </div>

      <router-link
        class="button button-secondary"
        :to="`/organiser/event-detail/${route.params.id}`"
      >
        Back to Event
      </router-link>
    </div>

    <section class="attendance-summary">
      <article class="summary-card">
        <span>Total Participants</span>
        <strong>{{ attendance.totalParticipants }}</strong>
      </article>

      <article class="summary-card">
        <span>Checked In</span>
        <strong>{{ attendance.checkedInCount }}</strong>
      </article>

      <article class="summary-card">
        <span>Attendance Rate</span>
        <strong>{{ attendanceRate }}%</strong>
      </article>

      <button class="button button-primary" :disabled="isExporting" @click="downloadAttendance">
        {{ isExporting ? 'Preparing CSV...' : 'Export CSV' }}
      </button>
    </section>

    <section class="attendance-card">
      <div class="section-heading">
        <div>
          <h2>Participant List</h2>
          <p>{{ attendance.participants.length }} confirmed participant(s)</p>
        </div>
      </div>

      <p v-if="isLoading" class="empty-state">Loading attendance records...</p>
      <p v-else-if="error" class="auth-error">{{ error }}</p>

      <div v-else-if="attendance.participants.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Matric No</th>
              <th>Email</th>
              <th>Ticket Code</th>
              <th>Status</th>
              <th>Checked At</th>
              <th>Method</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="participant in attendance.participants" :key="participant.registrationId">
              <td>{{ participant.name }}</td>
              <td>{{ participant.matricNo || '-' }}</td>
              <td>{{ participant.email }}</td>
              <td>{{ participant.ticketCode || '-' }}</td>
              <td>
                <span :class="['status-pill', participant.checkedIn ? 'checked' : 'pending']">
                  {{ participant.checkedIn ? 'Checked In' : 'Not Checked In' }}
                </span>
              </td>
              <td>{{ formatDateTime(participant.checkedAt) }}</td>
              <td>{{ participant.checkInMethod || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty-state">
        No confirmed participants found for this event yet.
      </p>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { exportAttendanceCsvApi, getOrganiserAttendanceApi } from '@/api/events'

const route = useRoute()

const isLoading = ref(false)
const isExporting = ref(false)
const error = ref('')

const attendance = reactive({
  eventId: null,
  eventTitle: '',
  capacity: 0,
  totalParticipants: 0,
  checkedInCount: 0,
  participants: [],
})

const attendanceRate = computed(() => {
  if (!attendance.totalParticipants) return 0
  return Math.round((attendance.checkedInCount / attendance.totalParticipants) * 100)
})

function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function loadAttendance() {
  error.value = ''
  isLoading.value = true

  try {
    const response = await getOrganiserAttendanceApi(route.params.id)
    const data = response.data.data

    attendance.eventId = data.eventId
    attendance.eventTitle = data.eventTitle
    attendance.capacity = data.capacity
    attendance.totalParticipants = data.totalParticipants
    attendance.checkedInCount = data.checkedInCount
    attendance.participants = data.participants || []
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Failed to load attendance records.'
  } finally {
    isLoading.value = false
  }
}

async function downloadAttendance() {
  error.value = ''
  isExporting.value = true

  try {
    const response = await exportAttendanceCsvApi(route.params.id)
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `attendance-event-${route.params.id}.csv`
    link.click()

    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = 'Failed to export attendance CSV.'
  } finally {
    isExporting.value = false
  }
}

onMounted(loadAttendance)
</script>

<style scoped>
.page-subtitle {
  margin: 6px 0 0;
  color: var(--muted);
}

.attendance-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 16px;
  align-items: stretch;
  margin-top: 24px;
}

.summary-card,
.attendance-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow);
}

.summary-card {
  padding: 18px;
}

.summary-card span {
  display: block;
  color: var(--muted);
  font-size: 0.88rem;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1.8rem;
}

.attendance-summary .button {
  align-self: center;
  min-height: 44px;
}

.attendance-card {
  margin-top: 20px;
  padding: 24px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0 0 6px;
  font-size: 1.15rem;
}

.section-heading p {
  margin: 0;
  color: var(--muted);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

th,
td {
  padding: 13px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

th {
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-pill.checked {
  background: #dcfce7;
  color: #166534;
}

.status-pill.pending {
  background: #fee2e2;
  color: #991b1b;
}

.empty-state {
  margin: 0;
  padding: 28px;
  border-radius: 14px;
  background: #f8fafc;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 860px) {
  .attendance-summary {
    grid-template-columns: 1fr;
  }

  .attendance-summary .button {
    width: 100%;
  }

  .attendance-card {
    padding: 18px;
  }
}
</style>