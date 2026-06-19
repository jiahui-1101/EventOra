<template>
  <div id="app-shell">
    <header class="site-header">
      <router-link class="brand" to="/" aria-label="EventOra home">
        <span class="brand-mark">E</span>
        <span>EventOra</span>
      </router-link>
      <nav class="desktop-nav" aria-label="Main navigation">
        <router-link to="/">Events</router-link>
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
      <router-link v-if="!authStore.isLoggedIn" to="/login">Login</router-link>
      <router-link v-if="authStore.isLoggedIn" to="/profile">Profile</router-link>
    </nav>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>