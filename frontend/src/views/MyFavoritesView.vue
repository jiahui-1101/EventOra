<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Attendee Portal</p>
        <h1>My Favorite Events</h1>
      </div>
    </div>

    <p v-if="loading">Loading favorites...</p>
    <p v-else-if="error" class="auth-error">{{ error }}</p>

    <section v-else class="event-grid">
      <article v-for="event in favorites" :key="event.id" class="event-card">
        <div class="event-image-container">
          <img :src="resolvePoster(event)" :alt="event.title" loading="lazy" />
          <span :class="['badge', categoryBadge(event.category)]">
            {{ event.category }}
          </span>
          <span class="badge badge-gray seats-badge">
            {{ event.seatsLeft > 0 ? `${event.seatsLeft} seats left` : (event.waitlistEnabled ? 'Waitlist' : 'Full') }}
          </span>
        </div>

        <div class="event-card-body">
          <span class="event-date">{{ formatDate(event.startAt) }}</span>
          <h3>{{ event.title }}</h3>
          <p>{{ event.venue }} · {{ event.societyName }}</p>

          <router-link :to="`/event/${event.id}`" class="button button-primary">
            View Event
          </router-link>

          <button class="button button-ghost" @click="removeFavorite(event.id)">
            Remove Favorite
          </button>
        </div>
      </article>
    </section>

    <p v-if="!loading && !favorites.length" class="empty-state">
      No favorite events yet.
    </p>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getFavoritesApi, removeFavoriteApi } from '@/api/events'

const loading = ref(true)
const error = ref('')
const favorites = ref([])

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '')

onMounted(async () => {
  try {
    const response = await getFavoritesApi()
    favorites.value = response.data.data || []
  } catch (e) {
    error.value = 'Failed to load favorite events.'
  } finally {
    loading.value = false
  }
})

async function removeFavorite(id) {
  await removeFavoriteApi(id)
  favorites.value = favorites.value.filter((event) => event.id !== id)
}

function resolvePoster(event) {
  const uploaded = event.posterUrl || event.poster_url
  if (uploaded && /^https?:\/\//i.test(uploaded)) return uploaded
  if (uploaded && uploaded.startsWith('/')) return `${apiOrigin}${uploaded}`
  return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80'
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })
}

function categoryBadge(category) {
  if (category === 'sports') return 'badge-green'
  if (category === 'cultural') return 'badge-purple'
  if (category === 'workshop') return 'badge-yellow'
  return 'badge-blue'
}
</script>
