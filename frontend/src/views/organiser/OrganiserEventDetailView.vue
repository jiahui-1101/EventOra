<template>
  <main class="detail-shell">
    <router-link class="back-link" to="/organiser/dashboard">← Back to Dashboard</router-link>

    <section class="detail-header">
      <div>
        <span class="badge badge-blue">Draft</span>
        <h1>{{ selectedEvent?.title || 'Event Title' }}</h1>
        <p>Computer Society UTM · Activity preview for organiser</p>
      </div>
    </section>

    <section class="detail-layout">
      <article class="detail-card">
        <div class="poster-preview">
          <div>
            <span :class="['badge', category === 'Sports' ? 'badge-yellow' : 'badge-blue']">{{ category }}</span>
            <h2>{{ selectedEvent?.title }}</h2>
            <p>{{ description }}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span>Date &amp; Time</span>
            <strong>{{ selectedEvent?.eventDate || 'Not set' }}, {{ selectedEvent?.startTime || '--' }} - {{ selectedEvent?.endTime || '--' }}</strong>
          </div>
          <div class="info-item">
            <span>Venue</span>
            <strong>{{ selectedEvent?.location || 'Not set' }}</strong>
          </div>
          <div class="info-item">
            <span>Registration Deadline</span>
            <strong>{{ selectedEvent?.registrationDeadline || 'Not set' }}</strong>
          </div>
          <div class="info-item">
            <span>Capacity</span>
            <strong>{{ selectedEvent?.capacity || 0 }} attendees</strong>
          </div>
          <div class="info-item">
            <span>Ticket</span>
            <strong>{{ ticketLabel }}</strong>
          </div>
          <div class="info-item">
            <span>Current Status</span>
            <strong>Draft</strong>
          </div>
        </div>

        <h2 class="section-title">Event Description</h2>
        <p style="color:var(--muted);line-height:1.6;">{{ description }}</p>
      </article>

      <aside class="side-card">
        <h2 style="margin:0 0 14px;font-size:1rem;">Approval Workflow</h2>

        <div class="approval-note approval-draft">
          <strong>Draft</strong>
          <p style="margin:6px 0 0;">This event is still editable.</p>
        </div>

        <div class="detail-list">
          <div><dt>Workflow</dt><dd>Draft → Pending approval → Published</dd></div>
          <div>
            <dt>Public listing</dt>
            <dd>Hidden until Faculty Admin approval</dd>
          </div>
          <div><dt>Last updated</dt><dd>8 Jun 2026, 10:30 AM</dd></div>
        </div>

        <h2 class="section-title">Available Actions</h2>
        <div class="action-list">
          <router-link to="/organiser/create-event" class="button button-secondary full-width">Edit Event</router-link>
          <button class="button button-primary full-width">Submit for Approval</button>
          <button class="button button-danger full-width">Delete Draft</button>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const eventsStorageKey = 'eventora_society_events_v2'

const defaultEvents = [
  {
    id: 1,
    title: 'Build Your First AI App',
    category: 'Academic',
    location: 'N28A Innovation Lab',
    eventDate: '12 Jun 2026',
    startTime: '7:30 PM',
    endTime: '9:30 PM',
    feeType: 'Paid',
    feeAmount: 8,
    status: 'published',
    registrations: 28,
    checkedIn: 18,
    capacity: 40,
  },
  {
    id: 2,
    title: 'Hackathon 2026',
    category: 'Academic',
    location: 'FAB Lab',
    eventDate: '5 Jul 2026',
    startTime: '9:00 AM',
    endTime: '6:00 PM',
    feeType: 'Paid',
    feeAmount: 15,
    status: 'pending_approval',
    registrations: 0,
    checkedIn: 0,
    capacity: 60,
  },
  {
    id: 3,
    title: 'Futsal Tournament',
    category: 'Sports',
    location: 'UTM Sports Hall',
    eventDate: '28 Jun 2026',
    startTime: '9:00 AM',
    endTime: '1:00 PM',
    feeType: 'Free',
    feeAmount: 0,
    status: 'published',
    registrations: 40,
    checkedIn: 32,
    capacity: 40,
  },
]

const eventDescriptions = {
  'Build Your First AI App':
    'A practical evening workshop where students learn how to plan, prototype, and demo a simple AI-powered application.',
  'Hackathon 2026':
    'A full-day hackathon for student teams to build software prototypes, receive mentor feedback, and present solutions.',
  'Futsal Tournament':
    'A sports event for student teams to compete in an interfaculty futsal tournament at UTM Sports Hall.',
  'Annual Tech Symposium 2026':
    'This symposium brings together students, organisers, and faculty members for a full-day technology event. The event includes talks, demo booths, and student project showcases.',
}

// ── State ────────────────────────────────────────────────────────────────────
const societyEvents = ref(
  JSON.parse(localStorage.getItem(eventsStorageKey) || 'null') || defaultEvents
)

// ── Selected event (by route param or query) ─────────────────────────────────
const selectedEvent = computed(() => {
  const id = route.params.id || route.query.id
  if (id) {
    return societyEvents.value.find((ev) => String(ev.id) === String(id)) || societyEvents.value[0]
  }
  return societyEvents.value[0]
})

// ── Derived values ────────────────────────────────────────────────────────────
const status = computed(() => selectedEvent.value?.status || 'draft')
const category = computed(() => selectedEvent.value?.category || 'Academic')
const description = computed(
  () =>
    selectedEvent.value?.description ||
    eventDescriptions[selectedEvent.value?.title] ||
    'No description has been added for this event yet.'
)
const ticketLabel = computed(() =>
  (selectedEvent.value?.feeType || '').toLowerCase() === 'paid'
    ? `RM ${selectedEvent.value?.feeAmount || 0}`
    : 'Free'
)
</script>

<style scoped>
.detail-shell { padding: 28px; background: var(--surface-soft); min-height: 100vh; }
.back-link { display: inline-flex; margin-bottom: 14px; color: var(--muted); text-decoration: none; font-size: 0.86rem; }
.detail-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 22px; }
.detail-header h1 { margin: 0 0 6px; font-size: 1.6rem; }
.detail-header p { margin: 0; color: var(--muted); font-size: 0.9rem; }
.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.detail-card,
.side-card { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow); padding: 24px; }
.poster-preview { min-height: 220px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; align-items: end; padding: 22px; margin-bottom: 18px; }
.poster-preview h2 { color: #fff; margin: 10px 0 6px; }
.poster-preview p { margin: 0; color: rgba(255, 255, 255, 0.82); }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.info-item { padding: 12px; border-radius: var(--radius-sm); background: var(--surface-soft); }
.info-item span { display: block; color: var(--muted); font-size: 0.74rem; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.info-item strong { display: block; color: var(--text); font-size: 0.9rem; }
.section-title { margin: 24px 0 10px; font-size: 1rem; }
.approval-note { padding: 14px; border-radius: var(--radius-sm); font-size: 0.86rem; margin-bottom: 14px; }
.approval-draft { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.approval-pending { background: var(--warning-soft); border: 1px solid #fde68a; color: #92400e; }
.approval-published { background: var(--success-soft); border: 1px solid #bbf7d0; color: #065f46; }
.approval-rejected,
.approval-cancelled { background: var(--danger-soft); border: 1px solid #fecaca; color: #991b1b; }
.action-list { display: grid; gap: 10px; }
.full-width { width: 100%; justify-content: center; }
@media (max-width: 900px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-header { display: block; }
}
</style>