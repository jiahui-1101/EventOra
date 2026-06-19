<template>
  <main class="app-shell">
    <section class="page-section auth-section">
      <div class="auth-shell">

        <div class="auth-brand">
          <span class="auth-brand-mark">E</span>
          <h2>EventOra</h2>
          <p class="auth-tagline">Join thousands of UTM students on the campus events platform.</p>
        </div>

        <div class="auth-card">
          <p class="eyebrow">Get started</p>
          <h3>Create your account</h3>

          <div class="input-row-2">
            <div class="input-label">First name <input type="text" v-model="firstName" placeholder="Mei" /></div>
            <div class="input-label">Last name <input type="text" v-model="lastName" placeholder="Shuet" /></div>
          </div>

          <div class="input-label">
            Email address
            <input type="email" v-model="email" placeholder="e.g. mei@utm.my" />
          </div>
          <div class="input-label">
            Password
            <input type="password" v-model="password" placeholder="Minimum 8 characters" />
          </div>
          <div class="input-label">
            Confirm password
            <input type="password" v-model="confirm" placeholder="Re-enter password" />
          </div>

          <div class="input-label">
            I am registering as
            <div class="role-selector">
              <label :class="['role-option', { 'role-active': role === 'attendee' }]">
                <input type="radio" name="role" value="attendee" v-model="role" />
                <strong>Attendee</strong>
                <span>Browse &amp; register for events</span>
              </label>
              <label :class="['role-option', { 'role-active': role === 'organiser' }]">
                <input type="radio" name="role" value="organiser" v-model="role" />
                <strong>Society Organiser</strong>
                <span>Create &amp; manage society events</span>
              </label>
            </div>
          </div>

          <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>

          <button class="button button-primary full-width auth-submit" @click="handleRegister">
            Create account
          </button>
          <p class="auth-footer-text">
            Already have an account? <router-link class="auth-link" to="/login">Sign in</router-link>
          </p>
        </div>

      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const role = ref('attendee')
const errorMessage = ref('')

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function handleRegister() {
  errorMessage.value = ''

  if (!firstName.value || !lastName.value || !email.value || !password.value || !confirm.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }
  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }
}
</script>