<template>
  <main class="app-shell">
    <section class="page-section admin-hero-section">
      <div class="section-heading admin-hero-heading">
        <div>
          <p class="eyebrow">Faculty of Computing</p>
          <h2>Faculty Admin Dashboard</h2>
          <p class="admin-subtitle">
            Review event submissions, monitor societies, and track campus activity.
          </p>
        </div>

        <router-link
          to="/notifications"
          class="dashboard-notification-button"
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
          <span
            v-if="unreadCount > 0"
            class="notification-dot"
          ></span>
        </router-link>
      </div>
    </section>

    <div class="admin-dashboard-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-title">
          <span class="brand-dot">A</span>
          <div>
            <strong>Faculty Admin</strong>
            <small>Approval tools</small>
          </div>
        </div>

        <router-link class="sidebar-link active" to="/admin">
          <span>DB</span>
          Dashboard
        </router-link>

        <router-link class="sidebar-link queue-link" to="/admin/approval-queue">
          <span>AQ</span>
          <div>
            <strong>Approval Queue</strong>
            <small>{{ pendingCount }} pending review</small>
          </div>
          <em>{{ pendingCount }}</em>
        </router-link>

        <a class="sidebar-link queue-link" href="#organiser-requests">
          <span>OR</span>
          <div>
            <strong>Organiser Requests</strong>
            <small>{{ pendingOrganiserRequestCount }} pending access</small>
          </div>
          <em>{{ pendingOrganiserRequestCount }}</em>
        </a>
      </aside>

      <div class="admin-main">
        <section class="page-section">
          <div class="admin-stats-grid">
            <article
              class="admin-stat-card admin-stat-alert clickable-card"
              role="button"
              tabindex="0"
              @click="goToApprovalQueue"
              @keydown.enter="goToApprovalQueue"
            >
              <span>Pending Approvals</span>
              <strong>{{ pendingCount }}</strong>
              <p>Awaiting your review</p>
            </article>

            <article class="admin-stat-card">
              <span>Active Societies</span>
              <strong>{{ activeSocietyCount }}</strong>
              <p>Under Faculty of Computing</p>
            </article>

            <article class="admin-stat-card">
              <span>Total Registrations</span>
              <strong>{{ totalRegistrations }}</strong>
              <p>This semester</p>
            </article>

            <article class="admin-stat-card">
              <span>Overall Attendance Rate</span>
              <strong>{{ overallAttendanceRate }}%</strong>
              <p>{{ totalCheckedIn }} of {{ totalRegistrations }} attended</p>
            </article>
          </div>
        </section>

        <section id="organiser-requests" class="page-section">
          <div class="section-heading">
            <h2>Organiser Society Requests</h2>
            <span class="badge badge-yellow">{{ pendingOrganiserRequestCount }} Pending</span>
          </div>

          <p v-if="loadingOrganiserRequests" style="color:var(--muted);">Loading organiser requests...</p>
          <p v-else-if="organiserRequestError" class="auth-error">{{ organiserRequestError }}</p>

          <div v-else class="admin-table-wrap">
            <table class="admin-table" aria-label="Organiser society requests">
              <thead>
                <tr>
                  <th>Organiser</th>
                  <th>Society</th>
                  <th>Description</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="organiserRequests.length === 0">
                  <td colspan="5" style="color:var(--muted);">No pending organiser requests.</td>
                </tr>
                <tr v-for="request in organiserRequests" :key="request.id">
                  <td>
                    <strong>{{ request.organiser_name }}</strong>
                    <small>{{ request.organiser_email }}</small>
                  </td>
                  <td>{{ request.society_name }}</td>
                  <td>{{ request.society_description || 'No description provided.' }}</td>
                  <td>{{ formatRequestDate(request.created_at) }}</td>
                  <td>
                    <div class="request-actions">
                      <button
                        class="button button-success"
                        type="button"
                        :disabled="reviewingRequestId === request.id"
                        @click="approveOrganiserRequest(request)"
                      >
                        Approve
                      </button>
                      <button
                        class="button button-danger"
                        type="button"
                        :disabled="reviewingRequestId === request.id"
                        @click="rejectOrganiserRequest(request)"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="page-section">
          <div class="section-heading">
            <h2>Society Activity Overview</h2>
            <span class="badge badge-blue">This Semester</span>
          </div>

          <p v-if="loadingSocieties" style="color:var(--muted);">Loading society data...</p>
          <p v-else-if="loadError" class="auth-error">{{ loadError }}</p>

          <div v-else class="admin-table-wrap">
            <table class="admin-table" aria-label="Society activity overview">
              <thead>
                <tr>
                  <th>Society</th>
                  <th>Events Held</th>
                  <th>Total Registered</th>
                  <th>Total Attended</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="s in societies" :key="s.name">
                  <td>{{ s.name }}</td>
                  <td>{{ s.events }}</td>
                  <td>{{ s.registered }}</td>
                  <td>{{ s.attended }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div style="flex:1;height:6px;border-radius:999px;background:var(--border);overflow:hidden;">
                        <div
                          :style="{
                            width: rate(s) + '%',
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: '999px',
                          }"
                        ></div>
                      </div>
                      <strong>{{ rate(s) }}%</strong>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="page-section">
          <div class="section-heading">
            <h2>Most Popular Events This Semester</h2>
            <span class="badge badge-green">Top 3</span>
          </div>

          <div>
            <article v-for="ev in popularEvents" :key="ev.rank" class="popular-event-card">
              <div class="popular-rank">{{ ev.rank }}</div>

              <div class="popular-info">
                <strong>{{ ev.title }}</strong>
                <span>{{ ev.society }} · {{ ev.date }}</span>
              </div>

              <div class="popular-meta">
                <span :class="['badge', ev.badgeClass]">{{ ev.category }}</span>
                <strong>{{ ev.registered }} registered</strong>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTicketingStore } from '@/stores/ticketing'
import {
  approvalEvents,
  loadApprovalEvents,
} from '@/stores/approvalEvents'
import { loadNotifications as loadStoredNotifications } from '@/stores/notifications'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const ticketingStore = useTicketingStore()

const societies = ref([])
const loadingSocieties = ref(true)
const loadError = ref('')
const notifications = ref([])

onMounted(async () => {
  loadApprovalEvents()
  ticketingStore.loadSeedData()

  try {
    const response = await axios.get('/mock/societies.json')
    societies.value = response.data
  } catch (err) {
    loadError.value = 'Failed to load society data. Please try again later.'
  } finally {
    loadingSocieties.value = false
  }

  loadNotifications()
})

const activeSocietyCount = computed(() => societies.value.length || 12)
const totalRegistrations = computed(() =>
  ticketingStore.events.reduce((sum, event) => {
    const summary = ticketingStore.getEventCapacitySummary(event.id)
    return sum + (summary?.occupiedCount || 0) + (summary?.waitlistCount || 0)
  }, 0)
)
const totalCheckedIn = computed(() =>
  ticketingStore.tickets.filter((ticket) => ticket.status === 'active' && ticket.checkedInAt).length
)
const overallAttendanceRate = computed(() =>
  totalRegistrations.value ? Math.round((totalCheckedIn.value / totalRegistrations.value) * 100) : 0
)

const popularEvents = computed(() =>
  ticketingStore.events
    .map((event) => {
      const summary = ticketingStore.getEventCapacitySummary(event.id)
      return {
        title: event.title,
        society: event.societyName,
        date: new Date(event.startAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }),
        category: event.category,
        badgeClass: event.badgeClass,
        registered: (summary?.occupiedCount || 0) + (summary?.waitlistCount || 0),
      }
    })
    .sort((first, second) => second.registered - first.registered)
    .slice(0, 3)
    .map((event, index) => ({ ...event, rank: index + 1 }))
)

const unreadCount = computed(() =>
  notifications.value.filter(
    (notification) => notification.audience === authStore.role && notification.unread
  ).length
)

const pendingCount = computed(() =>
  approvalEvents.value.filter((event) => event.status === 'pending').length
)

function goToApprovalQueue() {
  router.push('/admin/approval-queue')
}

function rate(s) {
  return Math.round((s.attended / s.registered) * 100)
}

async function loadNotifications() {
  try {
    notifications.value = await loadStoredNotifications()
  } catch (error) {
    notifications.value = []
  }
}
</script>

<style scoped>
.admin-hero-section {
  position: relative;
}

.admin-hero-heading {
  margin-bottom: 0;
  padding-right: 64px;
}

.admin-subtitle {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.dashboard-notification-button {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--text);
  text-decoration: none;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  font-size: 1.1rem;
  z-index: 3;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-notification-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.notification-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--danger);
  border: 2px solid #fff;
}

.admin-dashboard-layout {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.admin-sidebar {
  position: sticky;
  top: 84px;
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.sidebar-title {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 8px 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 6px;
}

.brand-dot {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--primary);
  color: white;
  font-weight: 800;
}

.sidebar-title strong,
.sidebar-title small,
.queue-link strong,
.queue-link small {
  display: block;
}

.sidebar-title small,
.queue-link small {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.sidebar-link {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 700;
  text-align: left;
  text-decoration: none;
}

.sidebar-link span {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--surface-soft);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 900;
}

.sidebar-link.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
}

.sidebar-link.active span {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.queue-link {
  position: relative;
  align-items: flex-start;
  border: 1px solid #fde68a;
  background: var(--warning-soft);
  color: #92400e;
}

.queue-link span {
  background: #fff7ed;
  color: #92400e;
}

.queue-link em {
  margin-left: auto;
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: var(--danger);
  color: white;
  font-style: normal;
  font-size: 0.75rem;
  font-weight: 800;
}

.admin-main {
  min-width: 0;
}

.clickable-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.clickable-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.clickable-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

@media (max-width: 980px) {
  .admin-dashboard-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: static;
  }
}
</style>
