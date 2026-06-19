<template>
  <main class="app-shell">
    <section class="page-section">

      <div class="section-heading">
        <div>
          <p class="eyebrow">Account settings</p>
          <h2>Edit Profile</h2>
        </div>
        <span class="badge badge-blue">{{ roleConfig.label }}</span>
      </div>

      <div class="profile-layout">

        <div class="profile-avatar-card">
          <div class="avatar-circle">{{ roleConfig.avatar }}</div>
          <strong>{{ firstName }} {{ lastName }}</strong>
          <span class="badge badge-blue">{{ roleConfig.label }}</span>
          <p class="profile-society">{{ society || 'EventOra member' }}</p>
          <button class="button button-ghost full-width" style="margin-top:8px;">Change photo</button>
        </div>

        <div class="profile-form-card">
          <h3>Personal Information</h3>

          <div class="input-row-2">
            <div class="input-label">First name <input type="text" v-model="firstName" /></div>
            <div class="input-label">Last name <input type="text" v-model="lastName" /></div>
          </div>

          <div class="input-label">Email <input type="email" v-model="email" /></div>
          <div class="input-label">Matric number <input type="text" v-model="matric" /></div>

          <div class="profile-divider">Security</div>

          <div class="input-label">Current password <input type="password" v-model="currentPw" /></div>
          <div class="input-row-2">
            <div class="input-label">New password <input type="password" v-model="newPw" /></div>
            <div class="input-label">Confirm <input type="password" v-model="confirmPw" /></div>
          </div>

          <div class="profile-actions">
            <router-link class="button button-ghost" :to="roleConfig.dashboard">Cancel</router-link>
            <button class="button button-primary" @click="handleSave">Save changes</button>
          </div>
        </div>
      </div>

    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const matric = ref('')
const society = ref('')
const currentPw = ref('')
const newPw = ref('')
const confirmPw = ref('')

const roleMap = {
  organiser: { label: 'Organiser', avatar: 'OR', dashboard: '/organiser/dashboard' },
  faculty_admin: { label: 'Faculty Admin', avatar: 'AD', dashboard: '/admin' },
  attendee: { label: 'Student', avatar: 'ST', dashboard: '/' },
}

const roleConfig = computed(() => roleMap[authStore.user?.role] || roleMap.attendee)

onMounted(() => {
  const user = authStore.user
  firstName.value = user?.firstName || ''
  lastName.value = user?.lastName || ''
  email.value = user?.email || ''
  matric.value = user?.matric || ''
  society.value = user?.society || ''
})

function handleSave() {
  // Logic to be implemented
}
</script>