<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Post-event analytics</p>
        <h1>Feedback & Attendance</h1>
      </div>
      <button class="button button-secondary" @click="downloadAttendance">
        Export attendance CSV
      </button>
    </div>

    <p v-if="loading">Loading feedback...</p>
    <p v-else-if="error" class="auth-error">{{ error }}</p>

    <section v-else class="detail-card">
      <h2>{{ averageLabel }}</h2>
      <p>{{ feedback.totalFeedback }} review(s)</p>

      <div v-for="score in [5,4,3,2,1]" :key="score" class="rating-row">
        <strong>{{ score }} star</strong>
        <span>{{ feedback.ratingBreakdown?.[score] || 0 }}</span>
      </div>

      <h3>Comments</h3>
      <article v-for="review in feedback.reviews" :key="review.id" class="comment-item">
        <strong>{{ review.reviewerName }} - {{ review.rating }}/5</strong>
        <p>{{ review.comment || 'No written comment.' }}</p>
        <small>{{ formatDate(review.submittedAt) }}</small>
      </article>

      <p v-if="!feedback.reviews?.length" class="empty-state">
        No attendee feedback yet.
      </p>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getOrganiserFeedbackApi, exportAttendanceCsvApi } from '@/api/events'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const feedback = ref({ reviews: [], ratingBreakdown: {} })

const averageLabel = computed(() =>
  feedback.value.averageRating === null
    ? 'No rating yet'
    : `${feedback.value.averageRating}/5 average rating`
)

onMounted(async () => {
  try {
    const response = await getOrganiserFeedbackApi(route.params.id)
    feedback.value = response.data.data
  } catch (e) {
    error.value = 'Failed to load feedback analytics.'
  } finally {
    loading.value = false
  }
})

async function downloadAttendance() {
  const response = await exportAttendanceCsvApi(route.params.id)
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `attendance-event-${route.params.id}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-MY') : ''
}
</script>