<template>
  <main class="app-shell">
    <section class="page-section">
      <div class="section-heading">
        <div><p class="eyebrow">Faculty Admin</p><h2>Event Approval Queue</h2></div>
        <span class="badge badge-yellow">{{ pendingCount }} pending</span>
      </div>

      <p v-if="loadingEvents" style="color:var(--muted);padding:20px 0;">Loading pending events...</p>
      <p v-else-if="loadError" class="auth-error">{{ loadError }}</p>

      <table v-else style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid var(--border);">
            <th>Society</th>
            <th>Event Title</th>
            <th>Date</th>
            <th>Category</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ev in approvalEvents" :key="ev.id" style="border-bottom:1px solid var(--border);">
            <td>{{ ev.society }}</td>
            <td>
              <strong>{{ ev.title }}</strong>
              <div v-if="ev.reason" style="color:var(--muted);font-size:0.78rem;margin-top:4px;">
                Reason: {{ ev.reason }}
              </div>
            </td>
            <td>{{ ev.date }}</td>
            <td>{{ ev.category }}</td>
            <td>{{ ev.capacity }}</td>
            <td>
              <span v-if="ev.status === 'approved'" class="badge badge-green">Approved</span>
              <span v-else-if="ev.status === 'rejected'" class="badge badge-red">Rejected</span>
              <span v-else class="badge badge-yellow">Pending</span>
            </td>
            <td class="admin-actions">
              <template v-if="ev.status === 'pending'">
                <button class="button button-primary" @click="approveEvent(ev)">Approve</button>
                <button class="button button-secondary" @click="openRejectModal(ev)">Reject</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="page-section">
      <h2>Activity Monitoring</h2>
      <div class="stats-grid" style="margin-top:1rem;">
        <div class="stat-card"><span>Total Events (This Month)</span><strong>18</strong></div>
        <div class="stat-card"><span>Active Societies</span><strong>12</strong></div>
        <div class="stat-card"><span>Total Registrations</span><strong>342</strong></div>
        <div class="stat-card"><span>Attendance Rate</span><strong>74%</strong></div>
      </div>
      <div class="capacity-bar" style="margin: 1rem 0;"><span style="width:74%"></span></div>
      <p>Most popular category: <strong>Academic</strong> (42% of registrations)</p>
    </section>

    <div v-if="showModal" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Reject event dialog" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <p class="eyebrow">You are rejecting</p>
            <h3>{{ selectedEvent?.title }}</h3>
            <span style="color:var(--muted);font-size:0.82rem;">{{ selectedEvent?.society }}</span>
          </div>
          <span class="badge badge-red">Pending rejection</span>
        </div>
        <div class="input-label" style="margin-top:20px;">
          Rejection reason <span style="color:var(--danger);">*</span>
          <textarea
            v-model="rejectReason"
            rows="4"
            placeholder="e.g. Venue booking confirmation missing. Please attach DSI approval letter and resubmit."
            style="padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.88rem;resize:vertical;width:100%;box-sizing:border-box;margin-top:6px;"
          ></textarea>
        </div>
        <p v-if="modalError" class="auth-error">{{ modalError }}</p>
        <div class="rejection-notice">
          <strong>📧 The organiser will be notified</strong>
          <p>Your reason will be sent as an in-app notification. The event returns to draft for revision.</p>
        </div>
        <div class="modal-actions" style="margin-top:20px;">
          <button class="button button-ghost" @click="closeModal">Cancel</button>
          <button class="button button-danger" @click="confirmReject">Confirm Rejection</button>
        </div>
      </div>
    </div>

    <div v-if="toast.message" :class="['eo-toast', toast.type]">{{ toast.message }}</div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const approvalEvents = ref([])
const loadingEvents = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    const response = await axios.get('/mock/approval-events.json')
    approvalEvents.value = response.data
  } catch (err) {
    loadError.value = 'Failed to load approval events. Please try again later.'
  } finally {
    loadingEvents.value = false
  }
})

const pendingCount = computed(() => approvalEvents.value.filter((e) => e.status === 'pending').length)

const showModal = ref(false)
const selectedEvent = ref(null)
const rejectReason = ref('')
const modalError = ref('')
const toast = ref({ message: '', type: 'success' })

function approveEvent(ev) {
  ev.status = 'approved'
  showToast('Event approved successfully.', 'success')
}

function openRejectModal(ev) {
  selectedEvent.value = ev
  rejectReason.value = ''
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedEvent.value = null
}

function confirmReject() {
  if (!rejectReason.value.trim()) {
    modalError.value = 'Please provide a rejection reason.'
    return
  }
  selectedEvent.value.status = 'rejected'
  selectedEvent.value.reason = rejectReason.value
  showToast('Event rejected. Reason has been recorded.', 'danger')
  closeModal()
}

function showToast(message, type) {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = { message: '', type: 'success' }
  }, 3000)
}
</script>

<style scoped>
.eo-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 20px;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  z-index: 9999;
}
.eo-toast.success { background: var(--success); }
.eo-toast.danger { background: var(--danger); }
</style>