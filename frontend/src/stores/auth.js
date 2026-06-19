import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(JSON.parse(localStorage.getItem('eventora_session') || 'null'))
  const registeredUser = ref(JSON.parse(localStorage.getItem('eventora_registered_user') || 'null'))

  const isLoggedIn = computed(() => !!session.value?.isLoggedIn)
  const user = computed(() => session.value?.user || null)
  const role = computed(() => user.value?.role || null)
  const isAdmin = computed(() => role.value === 'faculty_admin')
  const isOrganiser = computed(() => role.value === 'organiser')

  function logout() {
    session.value = null
    localStorage.removeItem('eventora_session')
    localStorage.removeItem('userRole')
  }

  return {
    session, registeredUser, user, isLoggedIn, role, isAdmin, isOrganiser,
    logout,
  }
})