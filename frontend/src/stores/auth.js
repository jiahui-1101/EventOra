import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('eventora_user')) || null)
  const token = ref(localStorage.getItem('eventora_token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || null)
  const isAdmin = computed(() => role.value === 'faculty_admin')
  const isOrganiser = computed(() => role.value === 'organiser')

  // Mock accounts — backend belum deploy pun boleh demo
  const mockAccounts = [
    { email: 'mei@utm.my', password: 'password123', role: 'faculty_admin', name: 'Mei Shuet' },
    { email: 'admin@utm.my', password: 'password123', role: 'faculty_admin', name: 'Admin UTM' },
    { email: 'organiser@utm.my', password: 'password123', role: 'organiser', name: 'Organiser Demo' },
    { email: 'student@utm.my', password: 'password123', role: 'attendee', name: 'Student Demo' },
  ]

  function login(email, password) {
    const found = mockAccounts.find(
      (acc) => acc.email === email && acc.password === password
    )
    if (!found) {
      return { success: false, message: 'Invalid email or password' }
    }
    user.value = { email: found.email, role: found.role, name: found.name }
    token.value = 'mock-jwt-token-' + Date.now()

    localStorage.setItem('eventora_user', JSON.stringify(user.value))
    localStorage.setItem('eventora_token', token.value)

    return { success: true }
  }

  function register(payload) {
    user.value = { email: payload.email, role: payload.role, name: payload.name }
    token.value = 'mock-jwt-token-' + Date.now()

    localStorage.setItem('eventora_user', JSON.stringify(user.value))
    localStorage.setItem('eventora_token', token.value)

    return { success: true }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('eventora_user')
    localStorage.removeItem('eventora_token')
  }

  return { user, token, isLoggedIn, role, isAdmin, isOrganiser, login, register, logout }
})