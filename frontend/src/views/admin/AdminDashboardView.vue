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
    </section>

  </main>
</template>

<script setup>
import { ref } from 'vue'

const pendingCount = ref(3)
</script>