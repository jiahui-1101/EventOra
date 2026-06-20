<template>
  <main class="app-shell">

    <section class="page-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Faculty of Computing</p>
          <h2>Faculty Admin Dashboard</h2>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <span class="badge badge-purple">Faculty Admin</span>
          <router-link class="button button-primary" to="/admin/approval-queue">
            Approval Queue
            <span class="badge badge-red" style="margin-left:6px;">{{ pendingCount }}</span>
          </router-link>
        </div>
      </div>

      <div class="admin-stats-grid">
        <article class="admin-stat-card admin-stat-alert">
          <span>Pending Approvals</span>
          <strong>{{ pendingCount }}</strong>
          <p>Awaiting your review</p>
        </article>
        <article class="admin-stat-card">
          <span>Active Societies</span>
          <strong>12</strong>
          <p>Under Faculty of Computing</p>
        </article>
        <article class="admin-stat-card">
          <span>Total Registrations</span>
          <strong>1,204</strong>
          <p>This semester</p>
        </article>
        <article class="admin-stat-card">
          <span>Overall Attendance Rate</span>
          <strong>82%</strong>
          <p>987 of 1,204 attended</p>
        </article>
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
                    <div :style="{ width: rate(s) + '%', height: '100%', background: 'var(--primary)', borderRadius: '999px' }"></div>
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

  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const pendingCount = ref(3)

// societies fetch from mock JSON file
const societies = ref([])
const loadingSocieties = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    const response = await axios.get('/mock/societies.json')
    societies.value = response.data
  } catch (err) {
    loadError.value = 'Failed to load society data. Please try again later.'
  } finally {
    loadingSocieties.value = false
  }
})

const popularEvents = ref([
  { rank: 1, title: 'Campus Cultural Night', society: 'Campus Culture Club', date: '20 Jun 2026', category: 'Cultural', badgeClass: 'badge-purple', registered: 312 },
  { rank: 2, title: 'UTM Sports Day', society: 'UTM Sports Society', date: '5 Jul 2026', category: 'Sports', badgeClass: 'badge-green', registered: 284 },
  { rank: 3, title: 'Build Your First AI App', society: 'UTM Computing Society', date: '12 Jun 2026', category: 'Academic', badgeClass: 'badge-blue', registered: 198 },
])

function rate(s) {
  return Math.round((s.attended / s.registered) * 100)
}
</script>