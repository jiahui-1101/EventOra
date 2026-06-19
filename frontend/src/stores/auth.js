import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(JSON.parse(localStorage.getItem('eventora_session') || 'null'))
  const registeredUser = ref(JSON.parse(localStorage.getItem('eventora_registered_user') || 'null'))

  function logout() {
    session.value = null
    localStorage.removeItem('eventora_session')
    localStorage.removeItem('userRole')
  }

  return {
    session, registeredUser,
    logout,
  }
})