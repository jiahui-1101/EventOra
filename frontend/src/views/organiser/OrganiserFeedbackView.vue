<template>
  <main class="app-shell page-section">
    <div class="toolbar" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <p class="eyebrow">Organizer Analytics</p>
        <h1>Post-Event Feedback & Attendance</h1>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <label style="font-weight: 600; color: #475569; font-size: 0.95rem;">Target Event:</label>
        <select v-model="selectedEventId" class="target-select">
          <option v-for="ev in events" :key="ev.id" :value="ev.id">{{ ev.title }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" style="padding: 60px; text-align: center;">Loading analytics layer...</div>

    <div v-else-if="!currentEvent" style="padding: 40px; text-align: center;">Please select an event.</div>

    <div v-else style="margin-top: 24px;">
      <section class="stats-grid" style="margin-bottom: 32px;">
        <article class="stat-card" style="background: #f0fdf4; border-color: #bbf7d0;">
          <span style="color: #166534; font-weight: 700;">Average Rating</span>
          <strong style="color: #15803d; font-size: 2.4rem;">⭐ {{ averageRating }} <span style="font-size: 1rem; color: #64748b;">/ 5.0</span></strong>
        </article>

        <article class="stat-card">
          <span>Total Feedbacks</span>
          <strong>{{ combinedFeedbacks.length }}</strong>
        </article>

        <article class="stat-card">
          <span>Confirmed Check-ins</span>
          <strong>{{ confirmedAttendees.length }}</strong>
        </article>

        <article class="stat-card" style="display: flex; align-items: center; justify-content: center;">
          <button class="button button-primary" @click="exportAttendanceCSV" style="width: 100%; justify-content: center;">
            📥 Export Attendance CSV
          </button>
        </article>
      </section>

      <div class="analytics-layout">
        <div class="panel-card">
          <h3 style="margin-top: 0;">Rating Distribution</h3>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 20px;">
            <div v-for="star in [5,4,3,2,1]" :key="star" class="dist-row">
              <span class="star-label">{{ star }} Stars</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${getStarPercent(star)}%` }"></div>
              </div>
              <span class="star-count">{{ getStarCount(star) }}</span>
            </div>
          </div>

          <button class="button button-secondary" @click="exportFeedbackCSV" style="width: 100%; margin-top: 32px; justify-content: center;">
            📊 Export Feedback Data (CSV)
          </button>
        </div>

        <div class="panel-card">
          <h3 style="margin-top: 0;">Attendee Comments ({{ combinedFeedbacks.length }})</h3>
          <div v-if="combinedFeedbacks.length === 0" style="padding: 40px 0; text-align: center; color: #94a3b8; font-style: italic;">
            No written reviews submitted for this event yet.
          </div>
          <div v-else class="comments-container">
            <div v-for="(fb, idx) in combinedFeedbacks" :key="idx" class="comment-bubble">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #f59e0b; font-size: 1.05rem;">{{ '★'.repeat(fb.rating) }}{{ '☆'.repeat(5-fb.rating) }}</span>
                <span style="font-size: 0.8rem; color: #94a3b8;">{{ formatDate(fb.submittedAt) }}</span>
              </div>
              <p style="margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.5;">"{{ fb.comment }}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(true)
const events = ref([])
const registrations = ref([])
const selectedEventId = ref('event-ai-app-2026')
const localFeedbacks = ref([])

const fbKey = 'eventora_feedbacks_v2'

const baseMockReviews = [
  { eventId: 'event-ai-app-2026', rating: 5, comment: 'Very practical hands-on building! The TA was extremely helpful.', submittedAt: '2026-06-21T10:00:00Z' },
  { eventId: 'event-ai-app-2026', rating: 4, comment: 'Loved the tech stack, but wish we had 30 more minutes.', submittedAt: '2026-06-21T11:30:00Z' },
  { eventId: 'event-cultural-night-2026', rating: 5, comment: 'The traditional music coordination was flawless!', submittedAt: '2026-06-22T09:15:00Z' },
  { eventId: 'event-cultural-night-2026', rating: 3, comment: 'Acoustics at the back of the hall were slightly muffled.', submittedAt: '2026-06-22T10:00:00Z' }
]

onMounted(async () => {
  localFeedbacks.value = JSON.parse(localStorage.getItem(fbKey) || '[]')
  try {
    const [resEv, resReg] = await Promise.all([
      fetch('/mock/events.json'),
      fetch('/mock/registrations.json')
    ])
    if (resEv.ok) events.value = await resEv.json()
    if (resReg.ok) registrations.value = await resReg.json()
    if (events.value.length > 0) selectedEventId.value = events.value[0].id
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const currentEvent = computed(() => events.value.find(e => e.id === selectedEventId.value))

const combinedFeedbacks = computed(() => {
  const stored = localFeedbacks.value.filter(f => f.eventId === selectedEventId.value)
  const base = baseMockReviews.filter(f => f.eventId === selectedEventId.value)
  return [...stored, ...base]
})

const averageRating = computed(() => {
  const total = combinedFeedbacks.value.length
  if (total === 0) return '0.0'
  const sum = combinedFeedbacks.value.reduce((acc, curr) => acc + curr.rating, 0)
  return (sum / total).toFixed(1)
})

const confirmedAttendees = computed(() => {
  return registrations.value.filter(r => r.eventId === selectedEventId.value && r.status === 'confirmed')
})

function getStarCount(s) { return combinedFeedbacks.value.filter(f => f.rating === s).length }
function getStarPercent(s) {
  const total = combinedFeedbacks.value.length
  return total === 0 ? 0 : Math.round((getStarCount(s) / total) * 100)
}

function exportAttendanceCSV() {
  const list = confirmedAttendees.value
  let csv = 'RegistrationID,AttendeeName,AttendeeEmail,CheckInStatus,TicketID\n'
  list.forEach(r => {
    csv += `"${r.id}","${r.attendeeName}","${r.attendeeEmail}","VERIFIED_ATTENDED","${r.ticketId || 'N/A'}"\n`
  })
  triggerDownload(csv, `Attendance_Report_${selectedEventId.value}.csv`)
}

function exportFeedbackCSV() {
  let csv = 'Score,AttendeeComment,SubmittedTimestamp\n'
  combinedFeedbacks.value.forEach(f => {
    csv += `"${f.rating}","${f.comment.replace(/"/g, '""')}","${f.submittedAt}"\n`
  })
  triggerDownload(csv, `Feedback_Analytics_${selectedEventId.value}.csv`)
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(d) { return new Date(d).toLocaleDateString('en-MY') }
</script>

<style scoped>
.target-select { padding: 10px 36px 10px 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; font-weight: 600; background-color: white; outline: none; cursor: pointer; }
.analytics-layout { display: grid; grid-template-columns: 1fr 1.6fr; gap: 24px; }
.panel-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.dist-row { display: flex; align-items: center; gap: 12px; }
.star-label { width: 65px; font-size: 0.9rem; color: #475569; font-weight: 600; }
.bar-track { flex: 1; height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: #3b82f6; border-radius: 999px; transition: width 0.4s ease; }
.star-count { width: 30px; text-align: right; font-size: 0.9rem; font-weight: 700; color: #0f172a; }
.comments-container { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; max-height: 420px; overflow-y: auto; padding-right: 6px; }
.comment-bubble { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; }
@media (max-width: 768px) { .analytics-layout { grid-template-columns: 1fr; } }
</style>