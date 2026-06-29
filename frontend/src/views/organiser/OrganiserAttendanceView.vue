<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Post-event records</p>
        <h1>Event Attendance</h1>
      </div>

      <router-link
        class="button button-secondary"
        :to="`/organiser/event-detail/${route.params.id}`"
      >
        Back to Event
      </router-link>
    </div>

    <section class="attendance-card">
      <div>
        <h2>Attendance CSV Export</h2>
        <p>
          Download verified attendance records for this event, including attendee name,
          matric number, email, ticket code, check-in status, check-in time, and method.
        </p>
      </div>

      <button class="button button-primary" :disabled="isExporting" @click="downloadAttendance">
        {{ isExporting ? 'Preparing CSV...' : 'Export Attendance CSV' }}
      </button>
    </section>

    <p v-if="error" class="auth-error">{{ error }}</p>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { exportAttendanceCsvApi } from '@/api/events'

const route = useRoute()
const isExporting = ref(false)
const error = ref('')

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
</script>

<style scoped>
.attendance-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-top: 24px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow);
}

.attendance-card h2 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.attendance-card p {
  margin: 0;
  max-width: 680px;
  color: var(--muted);
  line-height: 1.55;
}

@media (max-width: 760px) {
  .attendance-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>