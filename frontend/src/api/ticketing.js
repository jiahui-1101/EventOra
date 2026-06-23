import axios from 'axios'

const mockClient = axios.create({
  baseURL: '/mock',
  timeout: 5000,
})

export const TICKETING_MOCK_PATHS = Object.freeze({
  events: '/events.json',
  registrations: '/registrations.json',
  tickets: '/tickets.json',
})

async function fetchCollection(path, collectionName) {
  const response = await mockClient.get(path)

  if (!Array.isArray(response.data)) {
    throw new TypeError(`Expected ${collectionName} mock data to be an array.`)
  }

  return response.data
}

export function fetchEvents() {
  return fetchCollection(TICKETING_MOCK_PATHS.events, 'events')
}

export function fetchRegistrations() {
  return fetchCollection(TICKETING_MOCK_PATHS.registrations, 'registrations')
}

export function fetchTickets() {
  return fetchCollection(TICKETING_MOCK_PATHS.tickets, 'tickets')
}

export async function fetchTicketingSeed() {
  const [events, registrations, tickets] = await Promise.all([
    fetchEvents(),
    fetchRegistrations(),
    fetchTickets(),
  ])

  return { events, registrations, tickets }
}

export default mockClient
