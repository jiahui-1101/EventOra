<template>
  <div id="app-shell">
    <header class="site-header">
      <router-link class="brand" to="/" aria-label="EventOra home">
        <span class="brand-mark">E</span>
        <span>EventOra</span>
      </router-link>
      <nav class="desktop-nav" aria-label="Main navigation">
        <router-link to="/">Events</router-link>
        <router-link v-if="dashboardLink" :to="dashboardLink">Dashboard</router-link>
        <router-link v-if="!authStore.isLoggedIn" to="/login">Login</router-link>
        <router-link v-if="authStore.isLoggedIn" to="/profile">Profile</router-link>
        <a v-if="authStore.isLoggedIn" href="#" @click.prevent="handleLogout">Logout</a>
      </nav>
      <router-link
        v-if="!authStore.isLoggedIn"
        class="header-action"
        to="/register"
      >
        Create account
      </router-link>
    </header>

    <router-view />

    <nav class="mobile-nav" aria-label="Mobile navigation">
  <router-link to="/">Events</router-link>
  <router-link v-if="dashboardLink" :to="dashboardLink">Dashboard</router-link>
  <router-link v-if="!authStore.isLoggedIn" to="/login">Login</router-link>
  <router-link v-if="authStore.isLoggedIn" to="/profile">Profile</router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const dashboardLink = computed(() => {
  if (authStore.role === 'faculty_admin') return '/admin'
  if (authStore.role === 'organiser') return '/organiser/dashboard'
  return null
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>