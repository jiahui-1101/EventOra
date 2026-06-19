<template>
  <main class="app-shell">
    <section class="page-section auth-section">
      <div class="auth-shell">

        <div class="auth-brand">
          <span class="auth-brand-mark">E</span>
          <h2>EventOra</h2>
          <p class="auth-tagline">From idea to QR check-in — run your society events end-to-end.</p>
        </div>

        <div class="auth-card">
          <p class="eyebrow">Welcome back</p>
          <h3>Sign in to EventOra</h3>

          <div class="input-label">
            Email address
            <input
              type="email"
              v-model="email"
              placeholder="e.g. mei@utm.my"
              aria-label="Email address"
            />
          </div>
          <div class="input-label">
            Password
            <input
              type="password"
              v-model="password"
              placeholder="Enter your password"
              aria-label="Password"
            />
          </div>

          <div class="auth-options">
            <label class="remember-label">
              <input type="checkbox" v-model="rememberMe" aria-label="Remember me" /> Remember me
            </label>
            <a href="#" class="auth-link">Forgot password?</a>
          </div>

          <button class="button button-primary full-width auth-submit" @click="handleLogin" aria-label="Sign in">
            Sign in
          </button>

          <div class="auth-divider"><span>Sign in as</span></div>

          <div class="auth-roles">
            <button
              v-for="r in roles"
              :key="r.value"
              :class="['auth-role-chip', { active: selectedRole === r.value }]"
              @click="selectedRole = r.value"
              :aria-label="`Sign in as ${r.label}`"
            >
              {{ r.label }}
            </button>
          </div>

          <p class="auth-footer-text">
            Don't have an account? <router-link class="auth-link" to="/register">Create one</router-link>
          </p>
        </div>

      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const selectedRole = ref('attendee')

const roles = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'organiser', label: 'Organiser' },
  { value: 'faculty_admin', label: 'Faculty Admin' },
]

function handleLogin() {
  // Logic to be implemented
}
</script>