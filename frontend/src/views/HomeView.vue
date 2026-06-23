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

        <div style="margin-top: 14px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">🔥 Highlight:</span>
          <router-link 
            to="/event/event-ai-app-2026" 
            class="badge badge-blue" 
            style="text-decoration: none; font-size: 0.85rem; padding: 5px 10px; font-weight: 600; cursor: pointer;"
          >
            Build Your First AI App &rarr;
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
        <div :class="['event-cover', event.coverClass]">
          <span :class="['badge', event.badgeClass]">
            {{ capitalize(event.category) }}
          </span>

          <span
            v-if="event.seatsLeft > 0"
            class="badge badge-gray"
          >
            {{ event.seatsLeft }} seats left
          </span>

          <span
            v-else
            class="badge badge-yellow"
          >
            Full
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

const authStore = useAuthStore()

const keyword = ref('')
const category = ref('all')
const price = ref('all')
const dateFilter = ref('all')

const societyEventsStorageKey = 'eventora_society_events_v2'
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
    const res = await fetch('/mock/events.json')
    if (res.ok) {
      const rawEvents = await res.json()
      const fetchedEvents = rawEvents
        .filter((event) => event.status === 'published')
        .map(toPublicEvent)

      events.value = mergePublicEvents(fetchedEvents, loadPublishedSocietyEvents())
    } else {
      events.value = [...basePublicEvents]
    }
  } catch (err) {
    console.error("Unable to load event data, using local fallback", err)
    events.value = [...basePublicEvents]
  } finally {
    loadingEvents.value = false
  }
})

function toPublicEvent(event) {
  const category = (event.category || 'academic').toLowerCase()
  const confirmed = event.confirmedCount ?? 0
  const capacity = event.capacity ?? 0

  return {
    id: event.id,
    title: event.title,
    society: event.societyName || event.society || 'UTM Society',
    category,
    price: event.price ?? 0,
    priceType: event.priceType ?? 'free',
    date: event.startAt || event.date || new Date().toISOString(),
    venue: event.venue || 'Venue not set',
    seatsLeft: Math.max(capacity - confirmed, 0),
    coverClass: event.coverClass || coverForCategory(category),
    badgeClass: event.badgeClass || badgeForCategory(category),
  }
}

function loadPublishedSocietyEvents() {
  try {
    const savedEvents = JSON.parse(localStorage.getItem(societyEventsStorageKey) || '[]')
    if (!Array.isArray(savedEvents)) return []

    return savedEvents
      .filter((event) => event.status === 'published')
      .map(toPublicEvent)
  } catch (error) {
    return []
  }
}

function mergePublicEvents(...eventGroups) {
  const merged = new Map()

  eventGroups.flat().forEach((event) => {
    merged.set(String(event.id), event)
  })

  return [...merged.values()]
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
