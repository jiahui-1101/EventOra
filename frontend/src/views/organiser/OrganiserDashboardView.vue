<template>
  <main class="app-shell">
    <div class="dashboard-layout">

      <aside class="sidebar-nav">
      <a  
          v-for="tab in tabs"
          :key="tab.key"
          href="#"
          :class="{ active: currentTab === tab.key }"
          @click.prevent="currentTab = tab.key"
        >
          {{ tab.label }}
        </a>
      </aside>

      <div class="dashboard-main">

                <div class="od-stats-grid">
          <article class="od-stat-card">
            <span>Total Events</span>
            <strong>0</strong>
            <p>0 published · 0 pending</p>
          </article>
          <article class="od-stat-card">
            <span>Total Registrations</span>
            <strong>0</strong>
            <p>Across all events</p>
          </article>
          <article class="od-stat-card">
            <span>Total Attendance</span>
            <strong>0</strong>
            <p>0% attendance rate</p>
          </article>
          <article class="od-stat-card">
            <span>Avg. Feedback Rating</span>
            <strong>0 ★</strong>
            <p>From 0 responses</p>
          </article>
        </div>

      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const tabs = [
  { key: 'events', label: 'Events' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'feedback', label: 'Feedback' },
]

const currentTab = ref('events')
</script>