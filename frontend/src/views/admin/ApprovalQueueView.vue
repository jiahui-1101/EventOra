<template>
  <main class="app-shell">
    <section class="page-section">
      <div class="section-heading">
        <div><p class="eyebrow">Faculty Admin</p><h2>Event Approval Queue</h2></div>
        <span class="badge badge-yellow">{{ pendingCount }} pending</span>
      </div>

      <table style="width:100%; border-collapse:collapse;">
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
                <button class="button button-primary">Approve</button>
                <button class="button button-secondary">Reject</button>
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

        <div v-if="toast.message" :class="['eo-toast', toast.type]">{{ toast.message }}</div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'

const approvalEvents = ref([
  { id: 101, society: 'Robotics Club', title: 'Line Follower Workshop', date: '2026-07-10', category: 'Academic', capacity: 30, status: 'pending' },
  { id: 102, society: 'Entrepreneurship Society', title: 'Startup Pitch Night', date: '2026-07-15', category: 'Academic', capacity: 50, status: 'approved' },
  { id: 103, society: 'Music Club', title: 'Acoustic Night', date: '2026-07-18', category: 'Cultural', capacity: 80, status: 'rejected', reason: 'Venue booking confirmation is missing.' },
])

const pendingCount = computed(() => approvalEvents.value.filter((e) => e.status === 'pending').length)
const toast = ref({ message: '', type: 'success' })

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