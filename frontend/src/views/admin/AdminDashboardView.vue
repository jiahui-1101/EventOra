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
      <div class="admin-table-wrap">
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
          </tbody>
        </table>
      </div>
    </section>

  </main>
</template>

<script setup>
import { ref } from 'vue'

const pendingCount = ref(3)
</script>