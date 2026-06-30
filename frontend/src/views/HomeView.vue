<template>
  <main class="app-shell">
    <section class="hero-section">
      <router-link
        v-if="authStore.isLoggedIn"
        to="/notifications"
        class="hero-notification-button"
        aria-label="Notifications"
        title="Notifications"
      >
        🔔
        <span
          v-if="unreadCount > 0"
          class="notification-dot"
        ></span>
      </router-link>

      <div>
        <p class="eyebrow">Discover events</p>
        <h1>What's happening at UTM?</h1>

        <p class="hero-copy">
          Browse society workshops, cultural nights, tournaments, and talks.
        </p>

        <div class="search-panel">
          <input
            v-model="keyword"
            type="text"
            placeholder="Search by title or society..."
          />
        </div>

        <div v-if="highlightEvent" style="margin-top: 14px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">🔥 Highlight:</span>
          <router-link 
            :to="`/event/${highlightEvent.id}`"
            class="badge badge-blue" 
            style="text-decoration: none; font-size: 0.85rem; padding: 5px 10px; font-weight: 600; cursor: pointer;"
          >
            {{ highlightEvent.title }} &rarr;
          </router-link>
        </div>
      </div>

      <aside class="hero-card">
        <span>This month</span>
        <strong>{{ filteredEvents.length }} events live</strong>
      </aside>
    </section>

    <section class="stats-grid" style="margin-top: 40px;">
      <article class="stat-card">
        <span>Upcoming Events</span>
        <strong>{{ filteredEvents.length }}</strong>
      </article>

      <article class="stat-card">
        <span>Active Societies</span>
        <strong>12</strong>
      </article>

      <article class="stat-card">
        <span>This Week</span>
        <strong>{{ thisWeekCount }}</strong>
      </article>

      <article class="stat-card">
        <span>Free Events</span>
        <strong>{{ freeCount }}</strong>
      </article>
    </section>

    <section class="toolbar">
      <div>
        <p class="eyebrow">Featured calendar</p>
        <h2>Upcoming society activities</h2>
      </div>

      <div class="filter-bar">
        <select v-model="category">
          <option value="all">All</option>
          <option value="academic">Academic</option>
          <option value="sports">Sports</option>
          <option value="cultural">Cultural</option>
          <option value="religious">Religious</option>
        </select>

        <select v-model="price">
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <select v-model="dateFilter">
          <option value="all">Any time</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>

        <button
          class="button button-secondary"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>
    </section>

    <section class="event-grid">
      <article
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card"
      >

<div class="event-image-container" style="height: 160px; position: relative; overflow: hidden; border-radius: 12px 12px 0 0; background: #f1f5f9;">
  
  <img
  :src="event.posterImage"
  :alt="event.title"
  loading="lazy"
  style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; display: block;"
  @error="useFallbackPoster($event, event)"
/>

  <span :class="['badge', event.badgeClass]" style="position: absolute; top: 12px; left: 12px; z-index: 2;">
    {{ capitalize(event.category) }}
  </span>

  <span v-if="event.seatsLeft > 0" class="badge badge-gray" style="position: absolute; top: 12px; right: 12px; z-index: 2; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);">
    {{ event.seatsLeft }} seats left
  </span>
  <span v-else class="badge badge-yellow" style="position: absolute; top: 12px; right: 12px; z-index: 2;">
    {{ event.waitlistEnabled ? 'Waitlist' : 'Full' }}
  </span>

</div>

        <div class="event-card-body">
          <span class="event-date">
            {{ formatDate(event.date) }}
          </span>

          <h3>{{ event.title }}</h3>

          <p>
            {{ event.venue }}
            ·
            {{ event.society }}
          </p>

          <div class="card-meta">
            <span>
              {{ event.priceType === 'paid'
                ? 'Paid ticket'
                : 'Open registration' }}
            </span>

            <strong>
              {{
                event.priceType === 'free'
                  ? 'Free'
                  : `RM ${event.price}`
              }}
            </strong>
          </div>

          <router-link 
            :to="`/event/${event.id}`" 
            class="button button-primary"
            style="text-decoration: none; display: flex; align-items: center; justify-content: center; width: 100%; height: 42px; box-sizing: border-box;"
          >
            View Registration
          </router-link>
        </div>
      </article>

      <div
        v-if="filteredEvents.length === 0"
        class="empty-state-card"
      >
        <span class="empty-icon">📭</span>
        <h3>No matching events found</h3>
        <p>We couldn't find any society activities matching your current filters or search query.</p>
        
        <button 
          class="button button-secondary" 
          @click="clearFilters"
          style="margin-top: 16px;"
        >
          Reset All Filters
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { loadNotifications } from '@/stores/notifications'
import apiClient from '@/api/client'

const categoryDefaultBanners = {
  academic: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=700&q=80', // 敲代码的极客茶话会
  sports:   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=700&q=80', // 热血体育馆
  cultural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=700&q=80', // 舞台灯光晚会
  religious:'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=700&q=80', // 庄严肃穆建筑群
  workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=700&q=80'  // 围坐讨论工作坊
}

const eventFallbackPosters = {
  'event-annual-tech-2026': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
  'event-ai-app-2026': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
  'event-cultural-night-2026': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80',
  'event-hackathon-2026': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
  'event-futsal-cup-2026': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
  'event-traditional-dance-2026': 'https://images.unsplash.com/photo-1519925610903-381054cc2a1c?auto=format&fit=crop&w=900&q=80',
  'event-robotics-showcase-2026': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80',
  'event-career-prep-2026': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  'event-sustainability-day-2026': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
  'event-startup-pitch-2026': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=80',
}

const eventTitleFallbackPosters = {
  'Campus Cultural Night': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80',
  'Campus Photography Workshop': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
}

const fallbackPosterPool = [
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
]

function resolveEventPoster(event, category) {
  const uploaded = event.posterUrl || event.poster_url || event.posterImage

  if (uploaded && /^https?:\/\//i.test(uploaded)) return uploaded
  if (uploaded && uploaded.startsWith('/')) return `${apiOrigin}${uploaded}`
  if (uploaded) return `${apiOrigin}/${uploaded}`

  const eventId = String(event.id || '')
  if (eventFallbackPosters[eventId]) return eventFallbackPosters[eventId]

  if (eventTitleFallbackPosters[event.title]) {
    return eventTitleFallbackPosters[event.title]
  }

  const hash = [...(eventId || event.title || category)].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  )

  return fallbackPosterPool[hash % fallbackPosterPool.length]
}

function useFallbackPoster(imageEvent, event) {
  const fallback =
    eventTitleFallbackPosters[event.title] ||
    eventFallbackPosters[String(event.id || '')] ||
    categoryDefaultBanners[event.category] ||
    categoryDefaultBanners.academic

  imageEvent.target.src = fallback
}

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '')

function resolvePosterUrl(value, category) {
  if (value && /^https?:\/\//i.test(value)) return value
  if (value && value.startsWith('/')) return `${apiOrigin}${value}`
  if (value) return `${apiOrigin}/${value}`

  return categoryDefaultBanners[category] || categoryDefaultBanners.academic
}

const authStore = useAuthStore()

const keyword = ref('')
const category = ref('all')
const price = ref('all')
const dateFilter = ref('all')

const notifications = ref([])

const unreadCount = computed(() =>
  notifications.value.filter(
    (notification) =>
      notification.audience === authStore.role &&
      notification.unread
  ).length
)

const events = ref([])
const loadingEvents = ref(true)

const basePublicEvents = [
  {
    id: 'event-annual-tech-2026',
    title: 'Annual Tech Symposium 2026',
    society: 'Computer Society UTM',
    category: 'academic',
    price: 5,
    priceType: 'paid',
    date: '2026-07-15T09:00:00',
    venue: 'Dewan Sultan Iskandar, UTM JB',
    seatsLeft: 42,
    coverClass: 'academic-cover',
    badgeClass: 'badge-blue',
  },
  {
    id: 'event-ai-app-2026',
    title: 'Build Your First AI App',
    society: 'UTM Computing Society',
    category: 'academic',
    price: 8,
    priceType: 'paid',
    date: '2026-07-10T19:30:00+08:00',
    venue: 'N28A Innovation Lab',
    seatsLeft: 12,
    coverClass: 'academic-cover',
    badgeClass: 'badge-blue',
  },
  {
    id: 'event-cultural-night-2026',
    title: 'Campus Cultural Night',
    society: 'Campus Culture Club',
    category: 'cultural',
    price: 0,
    priceType: 'free',
    date: '2026-07-18T18:30:00+08:00',
    venue: 'Dewan Sultan Iskandar',
    seatsLeft: 54,
    coverClass: 'culture-cover',
    badgeClass: 'badge-purple',
  },
  {
    id: 'event-hackathon-2026',
    title: 'Hackathon 2026',
    society: 'Computer Society UTM',
    category: 'academic',
    price: 15,
    priceType: 'paid',
    date: '2026-07-20T09:00:00+08:00',
    venue: 'FAB Lab',
    seatsLeft: 18,
    coverClass: 'academic-cover',
    badgeClass: 'badge-blue',
  },
  {
    id: 'event-futsal-cup-2026',
    title: 'Interfaculty Futsal Cup',
    society: 'UTM Sports Club',
    category: 'sports',
    price: 0,
    priceType: 'free',
    date: '2026-07-25T09:00:00+08:00',
    venue: 'UTM Sports Hall',
    seatsLeft: 0,
    coverClass: 'sports-cover',
    badgeClass: 'badge-green',
  },
  {
    id: 'event-traditional-dance-2026',
    title: 'Traditional Dance Workshop',
    society: 'Campus Culture Club',
    category: 'cultural',
    price: 5,
    priceType: 'paid',
    date: '2026-07-27T15:00:00+08:00',
    venue: 'DK 1',
    seatsLeft: 8,
    coverClass: 'culture-cover',
    badgeClass: 'badge-purple',
  },
  {
    id: 'event-robotics-showcase-2026',
    title: 'Robotics Showcase',
    society: 'UTM Robotics Club',
    category: 'academic',
    price: 0,
    priceType: 'free',
    date: '2026-08-01T14:00:00+08:00',
    venue: 'FAB Lab',
    seatsLeft: 26,
    coverClass: 'academic-cover',
    badgeClass: 'badge-blue',
  },
  {
    id: 'event-career-prep-2026',
    title: 'Career Prep Clinic',
    society: 'Computer Society UTM',
    category: 'academic',
    price: 0,
    priceType: 'free',
    date: '2026-08-08T10:00:00+08:00',
    venue: 'N28 Seminar Room',
    seatsLeft: 29,
    coverClass: 'academic-cover',
    badgeClass: 'badge-blue',
  },
  {
    id: 'event-sustainability-day-2026',
    title: 'Sustainability Volunteer Day',
    society: 'Campus Culture Club',
    category: 'cultural',
    price: 0,
    priceType: 'free',
    date: '2026-08-15T08:30:00+08:00',
    venue: 'UTM Lake Area',
    seatsLeft: 36,
    coverClass: 'culture-cover',
    badgeClass: 'badge-purple',
  },
  {
    id: 'event-startup-pitch-2026',
    title: 'Startup Pitch Night',
    society: 'Computer Society UTM',
    category: 'academic',
    price: 10,
    priceType: 'paid',
    date: '2026-08-21T20:00:00+08:00',
    venue: 'Innovation Hub',
    seatsLeft: 1,
    coverClass: 'academic-cover',
    badgeClass: 'badge-blue',
  },
]

onMounted(async () => {
  notifications.value = await loadNotifications()

  try {
    const res = await apiClient.get('/events')
    const fetchedEvents = (res.data.data || []).map(toPublicEvent)
    events.value = fetchedEvents
  } catch (err) {
    console.error('Unable to load events from backend, using local fallback', err)
    events.value = [...basePublicEvents]
  } finally {
    loadingEvents.value = false
  }
})

function toPublicEvent(event) {
  const category = (event.category || 'academic').toLowerCase()
  const confirmed = event.confirmedCount ?? 0
  const occupied = event.occupiedCount ?? confirmed
  const capacity = event.capacity ?? 0
  const rawPrice = event.price ?? event.feeAmount ?? event.fee_amount ?? 0
  const normalizedPrice = Number(rawPrice) || 0
  const normalizedPriceType = event.priceType
    ?? event.feeType
    ?? event.fee_type
    ?? (normalizedPrice > 0 ? 'paid' : 'free')

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    society: event.societyName || event.society || 'UTM Society',
    category,
    price: normalizedPrice,
    priceType: normalizedPriceType,
    date: event.startAt || event.date || new Date().toISOString(),
    startAt: event.startAt || event.date || new Date().toISOString(),
    endAt: event.endAt || event.end_datetime || event.startAt || event.date || new Date().toISOString(),
    registrationDeadline: event.registrationDeadline || event.regDeadline || event.reg_deadline || event.startAt || event.date,
    venue: event.venue || 'Venue not set',
    capacity: Number(capacity) || 0,
    confirmedCount: Number(confirmed) || 0,
    occupiedCount: Number(occupied) || 0,
    waitlistEnabled: event.waitlistEnabled ?? event.waitlist_enabled ?? true,
    status: event.status || 'published',
    seatsLeft: Number.isFinite(Number(event.seatsLeft))
      ? Number(event.seatsLeft)
      : Math.max(capacity - occupied, 0),
    coverClass: event.coverClass || coverForCategory(category),
    badgeClass: event.badgeClass || badgeForCategory(category),
    posterImage: resolveEventPoster(event, category),
  }
}

function coverForCategory(categoryName) {
  if (categoryName === 'sports') return 'sports-cover'
  if (categoryName === 'cultural') return 'culture-cover'
  return 'academic-cover'
}

function badgeForCategory(categoryName) {
  if (categoryName === 'sports') return 'badge-green'
  if (categoryName === 'cultural') return 'badge-purple'
  return 'badge-blue'
}

function isInDateRange(eventDate, filter) {
  const today = new Date()
  const eventDay = new Date(eventDate)

  if (filter === 'week') {
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    return eventDay >= today && eventDay <= nextWeek
  }

  if (filter === 'month') {
    const nextMonth = new Date()
    nextMonth.setMonth(today.getMonth() + 1)
    return eventDay >= today && eventDay <= nextMonth
  }

  return true
}

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    if (category.value !== 'all' && event.category !== category.value) return false
    if (price.value !== 'all' && event.priceType !== price.value) return false
    if (dateFilter.value !== 'all' && !isInDateRange(event.date, dateFilter.value)) return false
    if (
      keyword.value &&
      !event.title.toLowerCase().includes(keyword.value.toLowerCase()) &&
      !event.society.toLowerCase().includes(keyword.value.toLowerCase())
    ) return false

    return true
  })
})

const highlightEvent = computed(() => filteredEvents.value[0] || events.value[0] || null)
const freeCount = computed(() => filteredEvents.value.filter((e) => e.priceType === 'free').length)
const thisWeekCount = computed(() => filteredEvents.value.filter((e) => isInDateRange(e.date, 'week')).length)

function clearFilters() {
  keyword.value = ''
  category.value = 'all'
  price.value = 'all'
  dateFilter.value = 'all'
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-MY', { dateStyle: 'medium' })
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
</script>

<style scoped>
.hero-section {
  position: relative;
}

.hero-notification-button {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--text);
  text-decoration: none;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  font-size: 1.1rem;
  z-index: 3;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hero-notification-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.notification-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--danger);
  border: 2px solid #fff;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-bar select {
  padding: 8px 32px 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border, #cbd5e1);
  background-color: var(--bg-surface, #ffffff);
  color: var(--text, #334155);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  
  appearance: none; 
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  background-size: 10px auto;
  
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.filter-bar select:hover {
  border-color: #94a3b8;
}

.filter-bar select:focus {
  border-color: var(--primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.empty-state-card {
  grid-column: 1 / -1; 
  width: 100%;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  background-color: var(--bg-surface, #f8fafc);
  border: 2px dashed var(--border, #cbd5e1);
  border-radius: 16px;
  text-align: center;
  margin: 16px 0;
  transition: border-color 0.2s ease;
}

.empty-state-card:hover {
  border-color: #94a3b8;
}

.empty-icon {
  font-size: 2.8rem;
  margin-bottom: 12px;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
}

.empty-state-card h3 {
  margin: 0 0 8px 0;
  font-size: 1.35rem;
  color: var(--text, #1e293b);
  font-weight: 700;
}

.empty-state-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  max-width: 420px;
  line-height: 1.5;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
