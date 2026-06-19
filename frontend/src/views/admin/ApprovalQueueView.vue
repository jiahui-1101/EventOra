<template>
  <main class="app-shell">
    <section class="page-section">
      <div class="section-heading">
        <div><p class="eyebrow">Faculty Admin</p><h2>Event Approval Queue</h2></div>
        <span class="badge badge-yellow">{{ pendingCount }} pending</span>
      </div>
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
  </main>
</template>

<script setup>
import { ref } from 'vue'

const pendingCount = ref(0)
</script>