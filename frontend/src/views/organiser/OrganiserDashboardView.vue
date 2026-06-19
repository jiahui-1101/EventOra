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