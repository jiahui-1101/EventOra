<template>
  <main class="app-shell page-section">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Post-event analytics</p>
        <h1>Event Feedback</h1>
      </div>

      <router-link
        class="button button-secondary"
        :to="`/organiser/event-detail/${route.params.id}`"
      >
        Back to Event
      </router-link>
    </div>

    <p v-if="loading">Loading feedback...</p>
    <p v-else-if="error" class="auth-error">{{ error }}</p>

    <template v-else>
      <section class="feedback-summary-grid">
        <article class="average-card">
          <span class="average-score">{{ averageScore }}</span>
          <strong>Average Rating</strong>
          <p>{{ feedback.totalFeedback }} review(s)</p>
        </article>

        <article class="rating-chart">
          <h2>Rating Distribution</h2>

          <div v-for="score in [5, 4, 3, 2, 1]" :key="score" class="rating-row">
            <span>{{ score }} ★</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: ratingPercent(score) + '%' }"
              ></div>
            </div>
            <strong>{{ feedback.ratingBreakdown?.[score] || 0 }}</strong>
          </div>
        </article>
      </section>

      <section class="feedback-filter">
        <label>
          Filter reviews
          <select v-model="selectedRating">
            <option value="all">All ratings</option>
            <option v-for="score in [5, 4, 3, 2, 1]" :key="score" :value="score">
              {{ score }} star
            </option>
          </select>
        </label>
      </section>

      <section>
        <article
          v-for="review in filteredReviews"
          :key="review.id"
          class="review-card"
        >
          <div class="review-header">
            <div>
              <strong>{{ review.reviewerName || 'Attendee' }}</strong>
              <p>{{ review.matricNo || 'No matric number' }}</p>
            </div>

            <span class="review-stars">{{ '★'.repeat(review.rating) }}</span>
          </div>

          <pre>{{ review.comment || 'No written comment.' }}</pre>
          <small>{{ formatDate(review.submittedAt) }}</small>
        </article>

        <p v-if="filteredReviews.length === 0" class="empty-state">
          No feedback matches this filter.
        </p>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getOrganiserFeedbackApi } from '@/api/events'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const selectedRating = ref('all')

const feedback = ref({
  totalFeedback: 0,
  averageRating: null,
  ratingBreakdown: {},
  reviews: [],
})

const averageScore = computed(() =>
  feedback.value.averageRating === null ? '-' : Number(feedback.value.averageRating).toFixed(1)
)

const filteredReviews = computed(() => {
  if (selectedRating.value === 'all') return feedback.value.reviews || []
  return (feedback.value.reviews || []).filter(
    (review) => Number(review.rating) === Number(selectedRating.value)
  )
})

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

function ratingPercent(score) {
  const total = feedback.value.totalFeedback || 0
  if (!total) return 0
  return Math.round(((feedback.value.ratingBreakdown?.[score] || 0) / total) * 100)
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-MY') : ''
}
</script>

<style scoped>
.feedback-summary-grid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 18px;
  margin-top: 20px;
}

.average-card,
.rating-chart,
.review-card,
.feedback-filter {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow);
}

.average-card {
  padding: 24px;
  text-align: center;
}

.average-score {
  display: block;
  font-size: 3rem;
  font-weight: 900;
  color: #f59e0b;
}

.average-card p {
  margin: 8px 0 0;
  color: var(--muted);
}

.rating-chart {
  padding: 20px;
}

.rating-chart h2 {
  margin: 0 0 14px;
  font-size: 1rem;
}

.rating-row {
  display: grid;
  grid-template-columns: 48px 1fr 32px;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
}

.bar-track {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f59e0b, #f97316);
}

.feedback-filter {
  margin: 20px 0;
  padding: 16px;
}

.feedback-filter label {
  display: grid;
  gap: 8px;
  max-width: 260px;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.feedback-filter select {
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font: inherit;
  text-transform: none;
}

.review-card {
  margin-top: 14px;
  padding: 16px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.review-header p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.review-stars {
  color: #f59e0b;
  font-weight: 900;
}

.review-card pre {
  white-space: pre-wrap;
  margin: 0 0 12px;
  color: #334155;
  font-family: inherit;
  line-height: 1.5;
}

.review-card small {
  color: var(--muted);
}

@media (max-width: 760px) {
  .feedback-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>