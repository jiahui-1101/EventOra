<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Attendee Portal</p>
        <h1>My Completed Events & E-Certificates</h1>
      </div>
    </div>

    <div v-if="loading" style="padding: 60px; text-align: center;">Loading completed events...</div>

    <section v-else class="event-grid">
      <article v-for="ev in myEvents" :key="ev.id" class="event-card">
        <div :class="['event-cover', ev.coverClass]">
          <span :class="['badge', ev.badgeClass]">{{ ev.category }}</span>
          <span v-if="ev.checkedIn" class="badge badge-green">✓ Attended (Verified)</span>
          <span v-else class="badge badge-yellow">Missed / Unverified</span>
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
      v-if="!loading && !myEvents.length"
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
import { useTicketingStore } from '@/stores/ticketing'

const loading = ref(true)
const feedbacks = ref([])
const activeEvent = ref(null)
const currentRating = ref(0)
const currentComment = ref('')

const fbKey = 'eventora_feedbacks_v2'
const authStore = useAuthStore()
const ticketingStore = useTicketingStore()
const attendeeEmail = computed(() => authStore.user?.email || '')
const attendeeName = computed(() => authStore.user?.name || authStore.user?.email || 'EventOra attendee')

onMounted(async () => {
  feedbacks.value = JSON.parse(localStorage.getItem(fbKey) || '[]')
  try {
    await ticketingStore.loadSeedData()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const myEvents = computed(() => {
  const now = Date.now()

  return ticketingStore
    .getTicketsForAttendee(attendeeEmail.value)
    .filter((ticket) =>
      ticket.status === 'active'
      && (ticket.checkedInAt || new Date(ticket.eventStartAt).getTime() < now)
    )
    .map((ticket) => {
    const event = ticketingStore.getEventById(ticket.eventId) || {}
    const fb = feedbacks.value.find(f => f.eventId === ticket.eventId)

    return {
      id: ticket.eventId,
      title: ticket.eventName,
      societyName: event.societyName || 'EventOra Society',
      category: event.category || 'event',
      venue: ticket.venue,
      startAt: ticket.eventStartAt,
      checkedIn: Boolean(ticket.checkedInAt),
      coverClass: event.coverClass || 'academic-cover',
      badgeClass: event.badgeClass || 'badge-blue',
      hasRated: !!fb,
      myRating: fb ? fb.rating : 0
    }
  })
})

function openRateModal(ev) {
  activeEvent.value = ev
  const existing = feedbacks.value.find(f => f.eventId === ev.id)
  currentRating.value = existing ? existing.rating : 5
  currentComment.value = existing ? existing.comment : ''
}

function closeModal() {
  activeEvent.value = null
  currentRating.value = 0
  currentComment.value = ''
}

function submitFeedback() {
  if (!activeEvent.value) return
  const targetId = activeEvent.value.id
  let list = [...feedbacks.value]
  const idx = list.findIndex(f => f.eventId === targetId)
  
  const payload = {
    eventId: targetId,
    rating: currentRating.value,
    comment: currentComment.value.trim() || 'No text comment provided.',
    submittedAt: new Date().toISOString()
  }

  if (idx >= 0) list[idx] = payload
  else list.push(payload)

  feedbacks.value = list
  localStorage.setItem(fbKey, JSON.stringify(list))
  alert('✓ Feedback submitted successfully! Your E-Certificate is officially logged.')
  closeModal()
}

function downloadCert(ev) {
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
        <div class="footer">ID: CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()} · Verifiable via EventOra Blockchain Ledger</div>
        <button class="print-btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
      </div>
    </body>
    </html>
  `)
  win.document.close()
}

function formatDate(d) { return new Date(d).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' }) }
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { background: white; padding: 28px; border-radius: 16px; width: 90%; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2); }
.star-rating-box { display: flex; gap: 12px; font-size: 2.6rem; justify-content: center; margin: 20px 0; cursor: pointer; user-select: none; }
.feedback-textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 0.95rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.feedback-textarea:focus { border-color: #3b82f6; }
</style>
