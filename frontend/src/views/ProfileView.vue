<template>
  <main class="app-shell">
    <section class="page-section">

      <div class="section-heading">
        <div>
          <p class="eyebrow">Account settings</p>
          <h2>Edit Profile</h2>
        </div>
        <span class="badge badge-blue">{{ roleConfig.label }}</span>
      </div>

      <p v-if="loadingProfile" style="color:var(--muted);padding:20px 0;">Loading profile...</p>
      <p v-else-if="loadError" class="auth-error">{{ loadError }}</p>

      <div v-else class="profile-layout">

        <div class="profile-avatar-card">
          <div class="avatar-circle">{{ roleConfig.avatar }}</div>
          <strong>{{ name }}</strong>
          <span class="badge badge-blue">{{ roleConfig.label }}</span>
          <p class="profile-society">{{ societyLabel }}</p>
          <button class="button button-ghost full-width" style="margin-top:8px;">Change photo</button>
        </div>

        <div class="profile-form-card">
          <h3>Personal Information</h3>

          <div class="input-label">Full name <input type="text" v-model="name" /></div>

          <div class="input-label">
            Email
            <input type="email" :value="email" disabled style="opacity:0.6;cursor:not-allowed;" />
          </div>
          <p style="color:var(--muted);font-size:0.78rem;margin-top:-4px;">
            Email can't be changed here. Contact a faculty admin if this needs to be corrected.
          </p>

          <div class="input-row-2">
            <div class="input-label">Matric number <input type="text" v-model="matricNo" /></div>
            <div class="input-label">Phone <input type="text" v-model="phone" /></div>
          </div>

          <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>
          <div
            v-if="showSuccess"
            style="display:block;margin-top:10px;padding:10px 14px;border-radius:var(--radius-sm);background:var(--success-soft);color:#065f46;"
          >
            Profile updated successfully!
          </div>

          <div class="profile-actions">
            <router-link class="button button-ghost" :to="roleConfig.dashboard">Cancel</router-link>
            <button class="button button-primary" :disabled="isSaving" @click="handleSave">
              {{ isSaving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>

    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getMeApi } from '@/api/profile'

const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const matricNo = ref('')
const phone = ref('')
const societyMemberships = ref([])

const loadingProfile = ref(true)
const loadError = ref('')
const isSaving = ref(false)
const errorMessage = ref('')
const showSuccess = ref(false)

const roleMap = {
  organiser: { label: 'Organiser', avatar: 'OR', dashboard: '/organiser/dashboard' },
  faculty_admin: { label: 'Faculty Admin', avatar: 'AD', dashboard: '/admin' },
  attendee: { label: 'Student', avatar: 'ST', dashboard: '/' },
}

const roleConfig = computed(() => roleMap[authStore.user?.role] || roleMap.attendee)

// society_memberships is an array (PR1: an organiser could theoretically
// belong to more than one society), so this just shows the first one -
// good enough for a profile summary line, not meant to be exhaustive.
const societyLabel = computed(() => {
  if (societyMemberships.value.length === 0) return 'EventOra member'
  return societyMemberships.value[0].society_name
})

async function loadProfile() {
  loadingProfile.value = true
  loadError.value = ''

  try {
    const response = await getMeApi()
    const profile = response.data.data

    name.value = profile.name || ''
    email.value = profile.email || ''
    matricNo.value = profile.matric_no || ''
    phone.value = profile.phone || ''
    societyMemberships.value = profile.society_memberships || []
  } catch (err) {
    loadError.value = err.response?.data?.error?.message || 'Failed to load profile.'
  } finally {
    loadingProfile.value = false
  }
}

onMounted(loadProfile)

async function handleSave() {
  errorMessage.value = ''
  showSuccess.value = false

  if (!name.value.trim()) {
    errorMessage.value = 'Name is required.'
    return
  }

  isSaving.value = true

  const result = await authStore.updateProfile({
    name: name.value.trim(),
    matric_no: matricNo.value.trim() || null,
    phone: phone.value.trim() || null,
  })

  isSaving.value = false

  if (!result.success) {
    errorMessage.value = result.message
    return
  }

  showSuccess.value = true
}
</script>