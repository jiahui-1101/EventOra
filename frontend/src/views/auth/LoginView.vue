<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Welcome back</h1>
      <p class="auth-subtitle">Login to manage your events and tickets</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="you@utm.my"
          required
        />

        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
        />

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

        <button type="submit" class="button button-primary auth-submit">
          Login
        </button>
      </form>

      <p class="auth-switch">
        Don't have an account?
        <router-link to="/register">Create one</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

function handleLogin() {
  errorMessage.value = ''
  const result = authStore.login(email.value, password.value)

  if (!result.success) {
    errorMessage.value = result.message
    return
  }
}
</script>