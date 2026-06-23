import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const roleProfiles = {
  attendee: {
    firstName: 'Student',
    lastName: 'User',
    email: 'student@utm.my',
    matric: 'A24CS0001',
    role: 'attendee',
    society: 'General Attendee',
  },
  organiser: {
    firstName: 'Mei',
    lastName: 'Shuet',
    email: 'mei@utm.my',
    matric: 'A24CS0102',
    role: 'organiser',
    society: 'UTM Computing Society',
    societyId: 'UTM-CS',
  },
  faculty_admin: {
    firstName: 'Faculty',
    lastName: 'Admin',
    email: 'admin@utm.my',
    matric: 'ADMIN001',
    role: 'faculty_admin',
    society: 'Faculty of Computing',
  },
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref(JSON.parse(localStorage.getItem('eventora_session') || 'null'))
  const registeredUser = ref(JSON.parse(localStorage.getItem('eventora_registered_user') || 'null'))

  const isLoggedIn = computed(() => !!session.value?.isLoggedIn)
  const user = computed(() => session.value?.user || null)
  const role = computed(() => user.value?.role || null)
  const isAdmin = computed(() => role.value === 'faculty_admin')
  const isOrganiser = computed(() => role.value === 'organiser')

  function login(email, password, selectedRole, rememberMe) {
    const baseProfile =
      registeredUser.value && registeredUser.value.email === email
        ? registeredUser.value
        : roleProfiles[selectedRole]

    const sessionUser = { ...baseProfile, email, role: selectedRole }

    session.value = {
      isLoggedIn: true,
      rememberMe,
      signedInAt: new Date().toISOString(),
      user: sessionUser,
    }

    localStorage.setItem('eventora_session', JSON.stringify(session.value))
    localStorage.setItem('userRole', selectedRole)

    return { success: true }
  }

  function register(payload) {
    registeredUser.value = payload
    localStorage.setItem('eventora_registered_user', JSON.stringify(payload))
    return { success: true }
  }

  function updateProfile(updatedUser) {
    registeredUser.value = updatedUser
    session.value = { ...(session.value || {}), isLoggedIn: true, updatedAt: new Date().toISOString(), user: updatedUser }

    localStorage.setItem('eventora_registered_user', JSON.stringify(updatedUser))
    localStorage.setItem('eventora_session', JSON.stringify(session.value))
    localStorage.setItem('userRole', updatedUser.role)
  }

  function logout() {
    session.value = null
    localStorage.removeItem('eventora_session')
    localStorage.removeItem('userRole')
  }

  return {
    session, registeredUser, user, isLoggedIn, role, isAdmin, isOrganiser,
    login, register, updateProfile, logout,
  }
})
