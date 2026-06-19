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

          <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>

          <div
            v-if="showSuccess"
            style="display:block;margin:10px 0;padding:10px 14px;border-radius:var(--radius-sm);background:var(--success-soft);color:#065f46;font-size:0.84rem;"
          >
            Signed in successfully. Redirecting...
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errorMessage = ref('')
const showSuccess = ref(false)
const selectedRole = ref('attendee')

const roles = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'organiser', label: 'Organiser' },
  { value: 'faculty_admin', label: 'Faculty Admin' },
]

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function handleLogin() {
  errorMessage.value = ''
  showSuccess.value = false

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password.'
    return
  }
  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  const result = authStore.login(email.value, password.value, selectedRole.value, rememberMe.value)

  if (!result.success) {
    errorMessage.value = result.message
    return
  }

  showSuccess.value = true
  setTimeout(() => {
    if (selectedRole.value === 'organiser') router.push('/organiser/dashboard')
    else if (selectedRole.value === 'faculty_admin') router.push('/admin')
    else router.push('/')
  }, 700)
}
</script>