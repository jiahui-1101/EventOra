<template>
  <main class="app-shell">
    <div v-if="loading" style="padding: 60px; text-align: center;">
      Loading event details...
    </div>

    <div v-else-if="!event" style="padding: 60px; text-align: center;">
      <h2>Event not found</h2>
      <router-link to="/" class="button button-secondary">Back to Events</router-link>
    </div>

    <section v-else class="detail-layout page-section" style="margin-top: 24px;">
      <article class="event-detail-copy">
        <div :class="['event-banner', event.coverClass]" style="padding: 40px; border-radius: 16px; color: white; margin-bottom: 24px;">
          <span :class="['badge', event.badgeClass]">{{ event.societyName }}</span>
          <h2 style="margin-top: 12px; color: white;">{{ event.title }}</h2>
        </div>

        <h3>About this event</h3>
        <p style="line-height: 1.6; font-size: 1.1rem; margin-bottom: 24px;">{{ event.description }}</p>

        <dl class="detail-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: var(--bg-surface, #f8fafc); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <div>
            <dt style="font-size: 0.85rem; color: #64748b;">Date & Time</dt>
            <dd style="font-weight: 600; margin: 4px 0 0 0;">{{ formattedDate }}</dd>
          </div>
          <div>
            <dt style="font-size: 0.85rem; color: #64748b;">Venue</dt>
            <dd style="font-weight: 600; margin: 4px 0 0 0;">{{ event.venue }}</dd>
          </div>
          <div>
            <dt style="font-size: 0.85rem; color: #64748b;">Category</dt>
            <dd style="font-weight: 600; margin: 4px 0 0 0; text-transform: capitalize;">{{ event.category }}</dd>
          </div>
          <div>
            <dt style="font-size: 0.85rem; color: #64748b;">Registration Closes</dt>
            <dd style="font-weight: 600; margin: 4px 0 0 0;">{{ formattedDeadline }}</dd>
          </div>
        </dl>

        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <button class="button button-secondary" @click="downloadICS">📅 Download .ics</button>
          <button class="button button-secondary" @click="addToGoogleCalendar">➕ Google Calendar</button>
          <button class="button button-ghost" @click="toggleFavorite">
            {{ isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites' }}
          </button>
          <button class="button button-ghost" @click="shareEvent">🔗 Share Link</button>
        </div>

        <div v-if="shareToast" style="color: #10b981; font-size: 0.85rem; margin-top: 8px; font-weight: 500;">
          ✓ Event link copied to clipboard!
        </div>
      </article>

      <aside class="registration-panel">
        <div class="registration-header">
          <div>
            <span class="badge badge-blue">{{ event.priceType === 'paid' ? 'Paid Ticket' : 'Free Entry' }}</span>
            <h3 style="margin: 8px 0 0 0;">Reserve your seat</h3>
          </div>
          <strong style="font-size: 1.5rem;">{{ event.priceType === 'paid' ? `RM ${event.price}` : 'Free' }}</strong>
        </div>

        <div class="capacity-labels">
          <span>{{ event.confirmedCount }} registered</span>
          <strong :style="{ color: seatsLeft === 0 ? '#ef4444' : 'inherit' }">
            {{ seatsLeft === 0 ? 'Fully Booked' : `${seatsLeft} seats left` }}
          </strong>
        </div>

        <div class="capacity-bar" style="margin-bottom: 24px;">
          <span :style="{ width: `${occupancyRate}%`, background: seatsLeft === 0 ? '#ef4444' : '#3b82f6' }"></span>
        </div>

        <div
          v-if="registrationNotice.message"
          :class="['registration-notice', registrationNotice.type]"
        >
          {{ registrationNotice.message }}
        </div>

        <div
          v-if="pendingRegistration"
          class="checkout-card"
        >
          <div class="checkout-row">
            <span>Ticket price</span>
            <strong>RM {{ event.price.toFixed(2) }}</strong>
          </div>
          <div class="checkout-row">
            <span>Processing fee</span>
            <strong>RM 0.00</strong>
          </div>
          <div class="checkout-total">
            <span>Total</span>
            <strong>RM {{ event.price.toFixed(2) }}</strong>
          </div>

          <div class="payment-methods" aria-label="Payment method">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              :class="{ active: paymentMethod === method.id }"
              type="button"
              @click="paymentMethod = method.id"
            >
              {{ method.label }}
            </button>
          </div>

          <label for="payment-reference">{{ selectedPaymentMethod.referenceLabel }}</label>
          <input
            id="payment-reference"
            v-model="paymentReference"
            type="text"
            :placeholder="selectedPaymentMethod.placeholder"
          />

          <div class="checkout-actions">
            <button
              class="button button-primary full-width"
              type="button"
              @click="approvePayment"
            >
              Pay now
            </button>
            <button
              class="button button-secondary full-width"
              type="button"
              @click="declinePayment"
            >
              Cancel
            </button>
          </div>
        </div>

        <div
          v-if="confirmedTicket"
          class="ticket-created-card"
        >
          <span>Ticket issued</span>
          <strong>{{ confirmedTicket.id }}</strong>
          <p>Your QR ticket is ready in My Tickets.</p>
          <router-link
            class="button button-secondary full-width"
            to="/tickets"
          >
            View My Tickets
          </router-link>
        </div>

        <button 
          v-if="!pendingRegistration && !confirmedTicket"
          class="button button-primary full-width" 
          style="justify-content: center;"
          :disabled="seatsLeft === 0 && !event.waitlistEnabled"
          @click="reserveSeat"
        >
          {{ buttonLabel }}
        </button>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTicketingStore } from '@/stores/ticketing'

const route = useRoute()
const authStore = useAuthStore()
const ticketingStore = useTicketingStore()
const loading = ref(true)
const event = ref(null)
const favorites = ref([])
const shareToast = ref(false)
const pendingRegistration = ref(null)
const confirmedTicket = ref(null)
const paymentMethod = ref('campus-card')
const paymentReference = ref('4242 4242 4242 4242')
const registrationNotice = ref({
  type: '',
  message: '',
})
const paymentMethods = [
  {
    id: 'campus-card',
    label: 'Campus Card',
    referenceLabel: 'Campus card number',
    placeholder: '4242 4242 4242 4242',
  },
  {
    id: 'online-banking',
    label: 'Online Banking',
    referenceLabel: 'Bank reference',
    placeholder: 'FPX reference number',
  },
  {
    id: 'ewallet',
    label: 'E-wallet',
    referenceLabel: 'Wallet phone number',
    placeholder: '+60 12 345 6789',
  },
]

const favKey = 'eventora_favs_v2'

const backupAnnualTech = {
  id: 'event-annual-tech-2026',
  title: 'Annual Tech Symposium 2026',
  societyName: 'Computer Society UTM',
  category: 'academic',
  price: 5,
  priceType: 'paid',
  startAt: '2026-07-15T09:00:00',
  endAt: '2026-07-15T17:00:00',
  registrationDeadline: '2026-07-10T23:59:00',
  venue: 'Dewan Sultan Iskandar, UTM JB',
  capacity: 120,
  confirmedCount: 78,
  description: 'Annual Tech Symposium 2026 brings together students, organisers, and faculty members for a full-day technology event. The event includes tech talks, demo booths, student project showcases, and networking sessions.',
  coverClass: 'academic-cover',
  badgeClass: 'badge-blue',
  waitlistEnabled: true
}

onMounted(async () => {
  favorites.value = JSON.parse(localStorage.getItem(favKey) || '[]')
  try {
    await ticketingStore.loadSeedData()
    const res = await fetch('/mock/events.json')
    const all = await res.json()
    
    let target = all.find(e => String(e.id) === String(route.params.id))
    
    if (!target && route.params.id === 'event-annual-tech-2026') {
      target = backupAnnualTech
    }
    
    event.value = target || null
  } catch(e) {
    console.error(e)
    if (route.params.id === 'event-annual-tech-2026') {
      event.value = backupAnnualTech
    }
  } finally {
    loading.value = false
  }
})

const capacitySummary = computed(() =>
  event.value ? ticketingStore.getEventCapacitySummary(event.value.id) : null
)
const registeredCount = computed(() => capacitySummary.value?.confirmedCount ?? event.value?.confirmedCount ?? 0)
const seatsLeft = computed(() =>
  event.value ? Math.max(event.value.capacity - registeredCount.value, 0) : 0
)
const occupancyRate = computed(() =>
  event.value ? Math.min(Math.round((registeredCount.value / event.value.capacity) * 100), 100) : 0
)
const isFavorited = computed(() => event.value ? favorites.value.includes(event.value.id) : false)

const formattedDate = computed(() => event.value ? new Date(event.value.startAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' }) : '')
const formattedDeadline = computed(() => event.value ? new Date(event.value.registrationDeadline).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' }) : '')
const selectedPaymentMethod = computed(() =>
  paymentMethods.find((method) => method.id === paymentMethod.value) || paymentMethods[0]
)

const buttonLabel = computed(() => {
  if (seatsLeft.value > 0) return event.value.priceType === 'paid' ? 'Proceed to secure checkout' : 'Confirm Free Registration'
  return event.value.waitlistEnabled ? 'Join Waitlist' : 'Registration Closed'
})

function toggleFavorite() {
  if (!event.value) return
  if (isFavorited.value) favorites.value = favorites.value.filter(id => id !== event.value.id)
  else favorites.value.push(event.value.id)
  localStorage.setItem(favKey, JSON.stringify(favorites.value))
}

function shareEvent() {
  navigator.clipboard.writeText(window.location.href)
  shareToast.value = true
  setTimeout(() => shareToast.value = false, 3000)
}

function downloadICS() {
  if (!event.value) return
  const s = new Date(event.value.startAt).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'
  const e = new Date(event.value.endAt).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'
  
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EventOra//VueRefactor\nBEGIN:VEVENT\nSUMMARY:${event.value.title}\nDESCRIPTION:${event.value.description}\nLOCATION:${event.value.venue}\nDTSTART:${s}\nDTEND:${e}\nEND:VEVENT\nEND:VCALENDAR`
  
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.value.id}.ics`
  a.click()
}

function addToGoogleCalendar() {
  if (!event.value) return
  const s = new Date(event.value.startAt).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'
  const e = new Date(event.value.endAt).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.value.title)}&dates=${s}/${e}&details=${encodeURIComponent(event.value.description)}&location=${encodeURIComponent(event.value.venue)}`, '_blank')
}

function attendeePayload() {
  const user = authStore.user

  return {
    id: user?.matric || user?.email || 'attendee-student-demo',
    name: user ? `${user.firstName} ${user.lastName}` : 'Student User',
    email: user?.email || 'student@utm.my',
  }
}

function setNotice(type, message) {
  registrationNotice.value = { type, message }
}

function reserveSeat() {
  if (!event.value) return

  try {
    if (event.value.priceType === 'paid' && seatsLeft.value > 0) {
      const result = ticketingStore.beginPaidRegistration(event.value.id, attendeePayload())
      if (result.payment === null) {
        setNotice('warning', `You have joined the waitlist at position #${result.registration.waitlistPosition}.`)
        return
      }

      pendingRegistration.value = result.registration
      setNotice('info', 'Your seat is held while you complete payment.')
      return
    }

    const result = ticketingStore.registerFreeEvent(event.value.id, attendeePayload())
    if (result.ticket) {
      confirmedTicket.value = result.ticket
      setNotice('success', 'Registration confirmed. Your QR ticket has been issued.')
    } else {
      setNotice('warning', `You have joined the waitlist at position #${result.registration.waitlistPosition}.`)
    }
  } catch (error) {
    setNotice('error', error instanceof Error ? error.message : 'Registration failed.')
  }
}

function approvePayment() {
  if (!pendingRegistration.value) return

  try {
    if (!paymentReference.value.trim()) {
      setNotice('error', 'Enter a valid payment reference to continue.')
      return
    }

    const result = ticketingStore.completeMockPayment(pendingRegistration.value.id)
    confirmedTicket.value = result.ticket
    pendingRegistration.value = null
    setNotice('success', 'Payment approved. Your QR ticket has been issued.')
  } catch (error) {
    setNotice('error', error instanceof Error ? error.message : 'Payment could not be completed.')
  }
}

function declinePayment() {
  if (!pendingRegistration.value) return

  try {
    ticketingStore.declineMockPayment(pendingRegistration.value.id)
    pendingRegistration.value = null
    setNotice('error', 'Payment cancelled. No ticket was issued.')
  } catch (error) {
    setNotice('error', error instanceof Error ? error.message : 'Payment could not be cancelled.')
  }
}
</script>

<style scoped>
.registration-notice {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.registration-notice.success,
.ticket-created-card {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.registration-notice.info {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.registration-notice.warning {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.registration-notice.error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.checkout-card,
.ticket-created-card {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 18px;
}

.checkout-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.checkout-row,
.checkout-total {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.checkout-row {
  color: #64748b;
}

.checkout-total {
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 1.1rem;
}

.checkout-card label {
  color: #475569;
  font-weight: 800;
}

.checkout-card input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px;
  font: inherit;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.payment-methods button {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 8px;
  color: #475569;
  background: #ffffff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
}

.payment-methods button.active {
  border-color: #4f46e5;
  color: #3730a3;
  background: #eef2ff;
}

.checkout-actions {
  display: grid;
  gap: 10px;
}

.ticket-created-card span {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.ticket-created-card strong {
  color: #064e3b;
  letter-spacing: 0.08em;
}

.ticket-created-card p {
  margin: 0;
  color: #047857;
}
</style>
