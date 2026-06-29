<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Attendee Portal</p>
        <h1>My Completed Events & E-Certificates</h1>
      </div>
    </div>

    <div v-if="loading" style="padding: 60px; text-align: center;">Loading completed events...</div>
    <p v-else-if="loadError" class="auth-error">{{ loadError }}</p>

    <section v-else class="event-grid">
      <article v-for="ev in myEvents" :key="ev.id" class="event-card">
        <div class="event-image-container">
  <img :src="ev.posterImage" :alt="ev.title" loading="lazy" />
  <span :class="['badge', ev.badgeClass]">{{ ev.category }}</span>
  <span v-if="ev.checkedIn" class="badge badge-green status-badge">Attended</span>
  <span v-else class="badge badge-yellow status-badge">Unverified</span>
</div>

        <div class="event-card-body">
          <span class="event-date">📅 Date: {{ formatDate(ev.startAt) }}</span>
          <h3>{{ ev.title }}</h3>
          <p>Venue: {{ ev.venue }}</p>

          <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px;">
            <template v-if="ev.checkedIn">
              <button 
                v-if="!ev.hasRated" 
                class="button button-primary" 
                @click="openRateModal(ev)"
                style="justify-content: center;"
              >
                ⭐ Rate & Submit Feedback
              </button>
              <div v-else style="color: #10b981; font-weight: 700; font-size: 0.95rem; text-align: center; background: #ecfdf5; padding: 8px; border-radius: 6px;">
                ★ {{ ev.myRating }} Stars Submitted
              </div>

              <button 
                class="button button-secondary" 
                @click="downloadCert(ev)"
                style="justify-content: center;"
              >
                📜 Download Auto E-Certificate
              </button>
            </template>

            <div v-else style="color: #64748b; font-size: 0.85rem; font-style: italic; text-align: center; background: #f1f5f9; padding: 8px; border-radius: 6px;">
              🔒 Check-in required to unlock Feedback & Certificate.
            </div>
          </div>
        </div>
      </article>
    </section>

    <p
      v-if="!loading && !loadError && !myEvents.length"
      class="empty-state"
    >
      Completed events will appear here after your ticket has been checked in.
    </p>

    <div v-if="activeEvent" class="modal-overlay">
      <div class="modal-content">
        <h3 style="margin-top: 0; color: #1e293b;">Rate: {{ activeEvent.title }}</h3>
        <p style="color: #64748b; font-size: 0.9rem;">Your feedback helps student organizers improve future sessions.</p>

        <div class="star-rating-box">
          <span 
            v-for="star in 5" 
            :key="star"
            @click="currentRating = star"
            :style="{ color: star <= currentRating ? '#f59e0b' : '#e2e8f0' }"
          >
            ★
          </span>
        </div>

        <textarea 
          v-model="currentComment" 
          rows="4" 
          placeholder="Share your experience (e.g., great speaker, lab AC was too cold)..."
          class="feedback-textarea"
        ></textarea>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
          <button class="button button-ghost" @click="closeModal">Cancel</button>
          <button class="button button-primary" :disabled="currentRating === 0" @click="submitFeedback">Submit Review</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  getCompletedEventsApi,
  issueCertificateApi,
  submitFeedbackApi,
} from '@/api/attendee'

const loading = ref(true)
const completedEvents = ref([])
const activeEvent = ref(null)
const currentRating = ref(0)
const currentComment = ref('')
const loadError = ref('')

const authStore = useAuthStore()
const attendeeName = computed(() => {
  const user = authStore.user
  if (!user) return 'EventOra attendee'
  return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
})

const completedFallbackPosters = {
  'event-annual-tech-2026': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
  'event-ai-app-2026': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
  'event-cultural-night-2026': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80',
  'event-hackathon-2026': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
  'event-futsal-cup-2026': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
}

const completedPosterPool = [
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
]

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '')

function resolveCompletedPoster(event) {
  const uploaded = event.posterUrl || event.poster_url || event.posterImage

  if (uploaded && /^https?:\/\//i.test(uploaded)) return uploaded
  if (uploaded && uploaded.startsWith('/')) return `${apiOrigin}${uploaded}`
  if (uploaded) return `${apiOrigin}/${uploaded}`

  const eventId = String(event.id || '')
  if (completedFallbackPosters[eventId]) return completedFallbackPosters[eventId]

  const hash = [...eventId || event.title || 'completed'].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  )

  return completedPosterPool[hash % completedPosterPool.length]
}

onMounted(async () => {
  try {
    const response = await getCompletedEventsApi()
    completedEvents.value = response.data.data
  } catch (e) {
    loadError.value = 'Failed to load completed events.'
  } finally {
    loading.value = false
  }
})

const myEvents = computed(() => {
  return completedEvents.value.map((event) => ({
    ...event,
    coverClass: `${event.category || 'academic'}-cover`,
    badgeClass: categoryBadge(event.category),
    posterImage: resolveCompletedPoster(event),
    hasRated: Boolean(event.feedback),
    myRating: event.feedback?.rating || 0,
  }))
})

function openRateModal(ev) {
  activeEvent.value = ev
  const existing = ev.feedback
  currentRating.value = existing ? existing.rating : 5
  currentComment.value = existing ? existing.comment : ''
}

function closeModal() {
  activeEvent.value = null
  currentRating.value = 0
  currentComment.value = ''
}

async function submitFeedback() {
  if (!activeEvent.value) return
  const targetId = activeEvent.value.id

  const payload = {
    rating: currentRating.value,
    comment: currentComment.value.trim() || 'No text comment provided.'
  }

  await submitFeedbackApi(targetId, payload)
  completedEvents.value = completedEvents.value.map((event) =>
    event.id === targetId
      ? {
          ...event,
          feedback: {
            rating: payload.rating,
            comment: payload.comment,
            submittedAt: new Date().toISOString(),
          },
        }
      : event
  )
  alert('✓ Feedback submitted successfully! Your E-Certificate is officially logged.')
  closeModal()
}

async function downloadCert(ev) {
  const response = await issueCertificateApi(ev.id)
  const certificate = response.data.data
  completedEvents.value = completedEvents.value.map((event) =>
    event.id === ev.id
      ? { ...event, certificate: { code: certificate.certificate_code, issuedAt: certificate.issued_at } }
      : event
  )

  const dateStr = new Date(ev.startAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })
  const win = window.open('', '_blank')
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>E-Certificate - ${ev.title}</title>
      <style>
        body { font-family: 'Georgia', serif; background: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
        .cert-container { background: #ffffff; border: 12px solid #1e3a8a; width: 100%; max-width: 850px; padding: 50px 40px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative; }
        .cert-container::before { content: "UTM VERIFIED"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); font-size: 80px; color: rgba(30, 58, 138, 0.04); font-weight: 900; pointer-events: none; }
        h1 { color: #1e3a8a; font-size: 2.6rem; margin: 0 0 10px 0; letter-spacing: 1px; }
        .eyebrow { color: #64748b; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px; }
        .awardee { font-size: 2.2rem; color: #0f172a; font-weight: bold; border-bottom: 2px solid #cbd5e1; display: inline-block; padding-bottom: 4px; min-width: 350px; margin: 10px 0 20px 0; }
        .event-title { font-size: 1.6rem; color: #1d4ed8; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 50px; font-size: 0.85rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .print-btn { margin-top: 30px; background: #1e3a8a; color: white; border: none; padding: 12px 30px; font-size: 1rem; font-weight: bold; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .print-btn:hover { background: #172554; }
        @media print { .print-btn { display: none; } body { background: white; } .cert-container { border: 8px solid #1e3a8a; box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <h1>CERTIFICATE OF PARTICIPATION</h1>
        <div class="eyebrow">Universiti Teknologi Malaysia</div>
        <p style="color: #475569; font-size: 1.1rem;">This is proudly presented to</p>
        <div class="awardee">${attendeeName.value}</div>
        <p style="color: #475569; font-size: 1.1rem;">for verified attendance and active completion of</p>
        <div class="event-title">${ev.title}</div>
        <p style="color: #64748b; font-style: italic;">organized by ${ev.societyName} on ${dateStr}</p>
        <div class="footer">ID: ${certificate.certificate_code} · Verified by EventOra attendance records</div>
        <button class="print-btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
      </div>
    </body>
    </html>
  `)
  win.document.close()
}

function formatDate(d) { return new Date(d).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' }) }

function categoryBadge(category) {
  const badges = {
    academic: 'badge-blue',
    workshop: 'badge-purple',
    sports: 'badge-green',
    cultural: 'badge-yellow',
    religious: 'badge-blue',
  }

  return badges[category] || 'badge-blue'
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { background: white; padding: 28px; border-radius: 16px; width: 90%; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2); }
.star-rating-box { display: flex; gap: 12px; font-size: 2.6rem; justify-content: center; margin: 20px 0; cursor: pointer; user-select: none; }
.feedback-textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 0.95rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.feedback-textarea:focus { border-color: #3b82f6; }
</style>
