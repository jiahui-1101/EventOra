<template>
  <main class="detail-shell">
    <router-link class="back-link" to="/organiser/dashboard">← Back to Dashboard</router-link>

    <section class="detail-header">
      <div>
        <span :class="['badge', badgeForStatus(status)]">{{ statusLabel(status) }}</span>
        <h1>{{ selectedEvent?.title || 'Event Title' }}</h1>
        <p>{{ selectedEvent?.society || 'Computer Society UTM' }} · Activity preview for organiser</p>
      </div>
    </section>

    <section class="detail-layout">
      <article class="detail-card">
        <div
          class="poster-preview"
          :style="eventImage ? {
            backgroundImage: `linear-gradient(rgba(49, 46, 129, 0.35), rgba(49, 46, 129, 0.55)), url(${eventImage})`
          } : {}"
        >
          <div>
            <span :class="['badge', category === 'Sports' ? 'badge-yellow' : 'badge-blue']">
              {{ category }}
            </span>
            <h2>{{ selectedEvent?.title }}</h2>
            <p>{{ description }}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span>Date &amp; Time</span>
            <strong>
              {{ selectedEvent?.eventDate || 'Not set' }},
              {{ selectedEvent?.startTime || '--' }} - {{ selectedEvent?.endTime || '--' }}
            </strong>
          </div>

          <div class="info-item">
            <span>Venue</span>
            <strong>{{ selectedEvent?.location || 'Not set' }}</strong>
          </div>

          <div class="info-item">
            <span>Registration Deadline</span>
            <strong>{{ formattedDeadline }}</strong>
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
            <strong>{{ statusLabel(status) }}</strong>
          </div>
        </div>

        <h2 class="section-title">Event Description</h2>
        <p class="description-text">{{ description }}</p>
      </article>

      <aside class="side-card">
        <h2>Approval Workflow</h2>

        <div :class="approvalNoteClass">
          <strong>{{ approvalNoteTitle }}</strong>
          <p>{{ approvalNoteText }}</p>
        </div>

        <div class="detail-list">
          <div>
            <dt>Workflow</dt>
            <dd>Draft → Pending approval → Published</dd>
          </div>

          <div>
            <dt>Public listing</dt>
            <dd>
              {{ status === 'published' ? 'Visible in public event list' : 'Hidden until Faculty Admin approval' }}
            </dd>
          </div>

          <div>
            <dt>Last updated</dt>
            <dd>8 Jun 2026, 10:30 AM</dd>
          </div>
        </div>

        <h2 class="section-title">Available Actions</h2>

        <div class="action-list">
          <span
            v-if="status === 'pending_approval'"
            class="badge badge-yellow status-full"
          >
            Waiting for Admin
          </span>

          <router-link
            v-if="status !== 'cancelled' && status !== 'completed'"
            :to="`/organiser/create-event?edit=${selectedEvent?.id}`"
            class="button button-secondary full-width"
          >
            Edit Event
          </router-link>

          <button
            v-if="status === 'draft' || status === 'rejected'"
            class="button button-primary full-width"
            @click="handleAction('submit')"
          >
            {{ status === 'rejected' ? 'Resubmit for Approval' : 'Submit for Approval' }}
          </button>

          <button
            v-if="status === 'draft' || status === 'rejected'"
            class="button button-danger full-width"
            @click="handleAction('delete')"
          >
            Delete Draft
          </button>

          <button
            v-if="status === 'pending_approval'"
            class="button button-danger full-width"
            @click="handleAction('cancel_submission')"
          >
            Cancel Submission
          </button>

          <button
            v-if="status === 'published'"
            class="button button-danger full-width"
            @click="handleAction('cancel')"
          >
            Cancel Event
          </button>

          <span
            v-if="status === 'cancelled' || status === 'completed'"
            class="badge badge-gray status-full"
          >
            No available actions
          </span>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const eventsStorageKey = 'eventora_society_events_v2'

const defaultEvents = [
  {
    id: 1,
    title: 'Build Your First AI App',
    category: 'Academic',
    society: 'Computer Society UTM',
    location: 'N28A Innovation Lab',
    description:
      'A practical evening workshop where students learn how to plan, prototype, and demo a simple AI-powered application.',
    bannerImage: '',
    posterImage: '',
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
    society: 'Computer Society UTM',
    location: 'FAB Lab',
    description:
      'A full-day hackathon for student teams to build software prototypes, receive mentor feedback, and present solutions.',
    bannerImage: '',
    posterImage: '',
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
    society: 'Sports Club UTM',
    location: 'UTM Sports Hall',
    description:
      'A sports event for student teams to compete in an interfaculty futsal tournament at UTM Sports Hall.',
    bannerImage: '',
    posterImage: '',
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

const societyEvents = ref(
  JSON.parse(localStorage.getItem(eventsStorageKey) || 'null') || defaultEvents
)

const selectedEvent = computed(() => {
  const id = route.params.id || route.query.id

  if (!id) return societyEvents.value[0] || null

  return societyEvents.value.find((ev) => String(ev.id) === String(id)) || null
})

const status = computed(() => selectedEvent.value?.status || 'draft')
const category = computed(() => selectedEvent.value?.category || 'Academic')
const eventImage = computed(() => selectedEvent.value?.posterImage || selectedEvent.value?.bannerImage)

const description = computed(
  () => selectedEvent.value?.description || 'No description has been added for this event yet.'
)

const ticketLabel = computed(() =>
  (selectedEvent.value?.feeType || '').toLowerCase() === 'paid'
    ? `RM ${selectedEvent.value?.feeAmount || 0}`
    : 'Free'
)

const formattedDeadline = computed(() => {
  const value = selectedEvent.value?.registrationDeadline

  if (!value) return 'Not set'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
})

function badgeForStatus(s) {
  if (s === 'published') return 'badge-green'
  if (s === 'pending_approval') return 'badge-yellow'
  if (s === 'completed') return 'badge-purple'
  if (s === 'rejected' || s === 'cancelled') return 'badge-red'
  return 'badge-blue'
}

function statusLabel(s) {
  if (s === 'pending_approval') return 'pending approval'
  return s || 'draft'
}

const approvalNoteClass = computed(() => {
  const map = {
    published: 'approval-note approval-published',
    pending_approval: 'approval-note approval-pending',
    rejected: 'approval-note approval-rejected',
    cancelled: 'approval-note approval-cancelled',
  }

  return map[status.value] || 'approval-note approval-draft'
})

const approvalNoteTitle = computed(() => {
  const map = {
    published: 'Published',
    pending_approval: 'Pending approval',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  return map[status.value] || 'Draft'
})

const approvalNoteText = computed(() => {
  const map = {
    published: 'This event is approved and visible in the public event list.',
    pending_approval: 'This event has been submitted and is waiting for Faculty Admin review.',
    rejected: 'This event needs changes before it can be submitted again.',
    cancelled: 'This event has been cancelled and is no longer available for registration.',
  }

  return map[status.value] || 'This event is still editable. Submit it when all details are ready.'
})

function saveEvents() {
  localStorage.setItem(eventsStorageKey, JSON.stringify(societyEvents.value))
}

function handleAction(action) {
  const id = selectedEvent.value?.id

  if (action === 'submit') {
    societyEvents.value = societyEvents.value.map((ev) =>
      ev.id === id ? { ...ev, status: 'pending_approval' } : ev
    )
    saveEvents()
    router.push({ path: '/organiser/dashboard', query: { eventAction: 'submitted' } })
  }

  if (action === 'delete') {
    societyEvents.value = societyEvents.value.filter((ev) => ev.id !== id)
    saveEvents()
    router.push({ path: '/organiser/dashboard', query: { eventAction: 'deleted' } })
  }

  if (action === 'cancel_submission') {
    societyEvents.value = societyEvents.value.map((ev) =>
      ev.id === id ? { ...ev, status: 'draft' } : ev
    )
    saveEvents()
    router.push({ path: '/organiser/dashboard', query: { eventAction: 'submission_cancelled' } })
  }

  if (action === 'cancel') {
    societyEvents.value = societyEvents.value.map((ev) =>
      ev.id === id ? { ...ev, status: 'cancelled' } : ev
    )
    saveEvents()
    router.push({ path: '/organiser/dashboard', query: { eventAction: 'cancelled' } })
  }
}
</script>

<style scoped>
.detail-shell {
  width: min(1080px, calc(100% - 80px));
  margin: 0 auto;
  padding: 28px 0 96px;
  min-height: 100vh;
}

.back-link {
  display: inline-flex;
  margin-bottom: 14px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.86rem;
}

.detail-header {
  margin-bottom: 22px;
}

.detail-header h1 {
  margin: 6px 0;
  font-size: 1.6rem;
}

.detail-header p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.detail-card,
.side-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
  padding: 24px;
}

.side-card h2 {
  margin: 0 0 14px;
  font-size: 1rem;
}

.poster-preview {
  min-height: 220px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  background-size: cover;
  background-position: center;
  color: #fff;
  display: flex;
  align-items: end;
  padding: 22px;
  margin-bottom: 18px;
}

.poster-preview h2 {
  color: #fff;
  margin: 10px 0 6px;
}

.poster-preview p {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.55;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
}

.info-item span {
  display: block;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 700;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item strong {
  display: block;
  color: var(--text);
  font-size: 0.9rem;
}

.section-title {
  margin: 24px 0 10px;
  font-size: 1rem;
}

.description-text {
  color: var(--muted);
  line-height: 1.6;
}

.approval-note {
  padding: 14px;
  border-radius: var(--radius-sm);
  font-size: 0.86rem;
  margin-bottom: 14px;
}

.approval-note p {
  margin: 6px 0 0;
}

.approval-draft {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.approval-pending {
  background: var(--warning-soft);
  border: 1px solid #fde68a;
  color: #92400e;
}

.approval-published {
  background: var(--success-soft);
  border: 1px solid #bbf7d0;
  color: #065f46;
}

.approval-rejected,
.approval-cancelled {
  background: var(--danger-soft);
  border: 1px solid #fecaca;
  color: #991b1b;
}

.action-list {
  display: grid;
  gap: 10px;
}

.full-width {
  width: 100%;
  justify-content: center;
}

.status-full {
  justify-content: center;
  width: 100%;
}

@media (max-width: 900px) {
  .detail-shell {
    width: min(100% - 32px, 1080px);
    padding: 18px 0 80px;
  }

  .detail-layout {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
