import { ref } from 'vue'
import axios from 'axios'

export const approvalEvents = ref([])
export const loadingApprovalEvents = ref(false)
export const approvalLoadError = ref('')

const approvalEventDetails = {
  101: {
    submittedBy: 'Siti Noor',
    submittedAt: '2 hours ago',
    displayDate: '10 Jul 2026, 9:00 AM - 1:00 PM',
    venue: 'N28A Innovation Lab',
    deadline: '8 Jul 2026, 11:59 PM',
    price: 'Free',
    description:
      'This workshop introduces students to sensors, motors, and microcontroller programming. Participants will work in teams to assemble and test a basic autonomous robot.',
  },
  102: {
    submittedBy: 'Aiman',
    submittedAt: '1 day ago',
    displayDate: '15 Jul 2026, 6:00 PM - 9:00 PM',
    venue: 'FAB Seminar Hall',
    deadline: '12 Jul 2026, 11:59 PM',
    price: 'Free',
    description:
      'Students pitch startup ideas to mentors and receive feedback on business models, customer validation, and presentation quality.',
  },
  103: {
    submittedBy: 'Razif',
    submittedAt: '1 day ago',
    displayDate: '18 Jul 2026, 7:30 PM - 10:30 PM',
    venue: 'Student Activity Centre',
    deadline: '15 Jul 2026, 11:59 PM',
    price: 'RM 8.00',
    description:
      'An evening performance featuring student musicians, acoustic sets, and small group performances.',
  },
}

export async function loadApprovalEvents() {
  if (approvalEvents.value.length > 0) return

  loadingApprovalEvents.value = true
  approvalLoadError.value = ''

  try {
    const response = await axios.get('/mock/approval-events.json')
    approvalEvents.value = response.data
  } catch (err) {
    approvalLoadError.value = 'Failed to load approval events. Please try again later.'
  } finally {
    loadingApprovalEvents.value = false
  }
}

export function updateApprovalEvent(id, status, reason = '') {
  const event = approvalEvents.value.find((item) => String(item.id) === String(id))

  if (event) {
    event.status = status
    event.reason = reason
  }
}

export function getApprovalEventDetails(event) {
  return approvalEventDetails[event.id] || {
    submittedBy: 'Organiser',
    submittedAt: 'recently',
    displayDate: event.date,
    venue: 'TBC',
    deadline: 'TBC',
    price: 'Free',
    description:
      'Event description preview. Admin can open full details to review the complete submission.',
  }
}