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
  backgroundImage: `linear-gradient(rgba(49, 46, 129, 0.35), rgba(49, 46, 129, 0.55)), url('${eventImage}')`
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
            <dd>{{ publicListingText }}</dd>
          </div>

          <div>
            <dt>Last updated</dt>
            <dd>8 Jun 2026, 10:30 AM</dd>
          </div>
        </div>

        <h2 class="section-title">Available Actions</h2>

        <p v-if="actionError" class="auth-error">{{ actionError }}</p>

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

  <router-link
    v-else-if="status === 'completed'"
    :to="`/organiser/create-event?view=${selectedEvent?.id}`"
    class="button button-secondary full-width"
  >
    View Event
  </router-link>

  <router-link
    v-if="status === 'published'"
    to="/organiser/check-in"
    class="button button-primary full-width"
  >
    Open QR Check-in
  </router-link>

  <button
    v-if="status === 'published'"
    class="button button-secondary full-width"
    @click="handleAction('complete')"
  >
    Mark as Completed
  </button>

  <router-link
    v-if="status === 'completed'"
    :to="`/organiser/event/${selectedEvent?.id}/feedback`"
    class="button button-primary full-width"
  >
    View Feedback
  </router-link>

  <router-link
    v-if="status === 'completed'"
    :to="`/organiser/event/${selectedEvent?.id}/attendance`"
    class="button button-secondary full-width"
  >
    View Attendance
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
    v-if="status === 'cancelled'"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelEventApi,
  cancelSubmissionApi,
  completeEventApi,
  deleteDraftEventApi,
  getMyEventApi,
  submitEventForApprovalApi,
} from '@/api/events'

const route = useRoute()
const router = useRouter()

const backendEvent = ref(null)
const backendEventLoaded = ref(false)
const actionError = ref('')
const hasBackendToken = computed(() => Boolean(localStorage.getItem('eventora_token')))

const selectedEvent = computed(() => backendEvent.value)

const status = computed(() => {
  if (!hasBackendToken.value) return 'auth_required'
  if (hasBackendToken.value && !backendEventLoaded.value) return 'loading'
  return selectedEvent.value?.status || 'not_found'
})
const category = computed(() => selectedEvent.value?.category || 'Academic')

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '')

function resolvePosterUrl(value) {
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  if (value.startsWith('/')) return `${apiOrigin}${value}`
  return `${apiOrigin}/${value}`
}

const fallbackEventImages = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
]

function getFallbackEventImage(event) {
  const key = String(event?.id || event?.title || 'event')
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return fallbackEventImages[hash % fallbackEventImages.length]
}

const eventImage = computed(() => {
  const event = selectedEvent.value

  const uploadedImage =
    event?.posterImage ||
    event?.bannerImage ||
    event?.posterUrl ||
    event?.poster_url ||
    ''

  return resolvePosterUrl(uploadedImage) || getFallbackEventImage(event)
})
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
  if (s === 'loading') return 'badge-gray'
  return 'badge-blue'
}

function statusLabel(s) {
  if (s === 'loading') return 'loading'
  if (s === 'pending_approval') return 'pending approval'
  return s || 'draft'
}

function formatDateOnly(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeOnly(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function toFrontendCategory(categoryValue) {
  if (!categoryValue) return 'Academic'

  return String(categoryValue)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function normaliseBackendEvent(rawEvent) {
  const start = rawEvent.startAt ? new Date(rawEvent.startAt) : null
  const end = rawEvent.endAt ? new Date(rawEvent.endAt) : null

  return {
    id: rawEvent.id,
    title: rawEvent.title,
    category: toFrontendCategory(rawEvent.category),
    society: rawEvent.society || rawEvent.society_name || 'Society not set',
    location: rawEvent.location || rawEvent.venue || 'Venue not set',
    description: rawEvent.description || '',
    bannerImage: rawEvent.posterUrl || rawEvent.poster_url || '',
    posterImage: rawEvent.posterUrl || rawEvent.poster_url || '',
    eventDate: rawEvent.eventDate || (start && !Number.isNaN(start.getTime()) ? formatDateOnly(start) : 'Not set'),
    startTime: rawEvent.startTime || (start && !Number.isNaN(start.getTime()) ? formatTimeOnly(start) : '--'),
    endTime: rawEvent.endTime || (end && !Number.isNaN(end.getTime()) ? formatTimeOnly(end) : '--'),
    registrationDeadline: rawEvent.registrationDeadline || '',
    feeType: rawEvent.feeType === 'paid' ? 'Paid' : 'Free',
    feeAmount: rawEvent.feeAmount || 0,
    status: rawEvent.status === 'pending' ? 'pending_approval' : rawEvent.status || 'draft',
    registrations: rawEvent.registrations ?? rawEvent.confirmedCount ?? 0,
    checkedIn: rawEvent.checkedIn ?? 0,
    capacity: rawEvent.capacity ?? 0,
  }
}

async function loadBackendEvent() {
  const id = route.params.id || route.query.id

  if (!hasBackendToken.value) {
    actionError.value = 'Please sign in with a backend organiser account to view this event.'
    backendEventLoaded.value = true
    return
  }

  if (!id) {
    actionError.value = 'No event was selected.'
    backendEventLoaded.value = true
    return
  }

  try {
    const response = await getMyEventApi(id)
    backendEvent.value = normaliseBackendEvent(response.data.data)
  } catch (error) {
    backendEvent.value = null
    actionError.value = error.response?.data?.error?.message || 'Could not load this event from the backend.'
  } finally {
    backendEventLoaded.value = true
  }
}

const approvalNoteClass = computed(() => {
  const map = {
    published: 'approval-note approval-published',
    pending_approval: 'approval-note approval-pending',
    completed: 'approval-note approval-published',
    rejected: 'approval-note approval-rejected',
    cancelled: 'approval-note approval-cancelled',
  }

  return map[status.value] || 'approval-note approval-draft'
})

const approvalNoteTitle = computed(() => {
  const map = {
    published: 'Published',
    pending_approval: 'Pending approval',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  return map[status.value] || 'Draft'
})

const approvalNoteText = computed(() => {
  const map = {
    published: 'This event is approved and visible in the public event list.',
    pending_approval: 'This event has been submitted and is waiting for Faculty Admin review.',
    completed: 'This event has ended and is kept for attendance, feedback, and certificate records.',
    rejected: 'This event needs changes before it can be submitted again.',
    cancelled: 'This event has been cancelled and is no longer available for registration.',
  }

  return map[status.value] || 'This event is still editable. Submit it when all details are ready.'
})

const publicListingText = computed(() => {
  const map = {
    published: 'Visible in public event list',
    completed: 'Archived after completion',
    pending_approval: 'Hidden until Faculty Admin approval',
    cancelled: 'Hidden because the event was cancelled',
    rejected: 'Hidden until changes are resubmitted',
    loading: 'Loading event visibility',
    auth_required: 'Sign in required',
    not_found: 'Event not found',
  }

  return map[status.value] || 'Hidden until submitted for approval'
})

async function handleAction(action) {
  const id = selectedEvent.value?.id
  actionError.value = ''

  if (!hasBackendToken.value) {
    actionError.value = 'Please sign in with a backend organiser account to update this event.'
    return
  }

  if (!id) {
    actionError.value = 'Could not find this event in the backend.'
    return
  }

  await handleBackendAction(action, id)
}

async function handleBackendAction(action, id) {
  try {
    if (action === 'submit') {
      await submitEventForApprovalApi(id)
      router.push({ path: '/organiser/dashboard', query: { eventAction: 'submitted' } })
      return
    }

    if (action === 'delete') {
      await deleteDraftEventApi(id)
      router.push({ path: '/organiser/dashboard', query: { eventAction: 'deleted' } })
      return
    }

    if (action === 'cancel_submission') {
      await cancelSubmissionApi(id)
      router.push({ path: '/organiser/dashboard', query: { eventAction: 'submission_cancelled' } })
      return
    }

    if (action === 'complete') {
      await completeEventApi(id)
      router.push({ path: '/organiser/dashboard', query: { eventAction: 'completed' } })
      return
    }

    if (action === 'cancel') {
      await cancelEventApi(id)
      router.push({ path: '/organiser/dashboard', query: { eventAction: 'cancelled' } })
    }
  } catch (error) {
    actionError.value = error.response?.data?.error?.message || 'Action failed. Please try again.'
  }
}

onMounted(loadBackendEvent)
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
