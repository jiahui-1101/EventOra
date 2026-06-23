const DEFAULT_TOKEN_BYTES = 24
const TICKET_CODE_GROUPS = 3
const TICKET_CODE_GROUP_LENGTH = 4
const TICKET_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function getCrypto() {
  return globalThis.crypto
}

function randomBytes(length) {
  const crypto = getCrypto()

  if (!crypto?.getRandomValues) {
    throw new Error('Secure random generation is not available in this browser.')
  }

  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function toBase64Url(bytes) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function randomAlphabetCharacter() {
  const [byte] = randomBytes(1)
  return TICKET_CODE_ALPHABET[byte % TICKET_CODE_ALPHABET.length]
}

export function generateTicketToken(byteLength = DEFAULT_TOKEN_BYTES) {
  return toBase64Url(randomBytes(byteLength))
}

export function generateTicketCode() {
  return Array.from({ length: TICKET_CODE_GROUPS }, () =>
    Array.from({ length: TICKET_CODE_GROUP_LENGTH }, randomAlphabetCharacter).join('')
  ).join('-')
}

export function createTicketSecurityFields() {
  return {
    token: generateTicketToken(),
    code: generateTicketCode(),
  }
}
