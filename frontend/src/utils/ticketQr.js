import QRCode from 'qrcode'

export function buildTicketQrPayload(ticket) {
  return JSON.stringify({
    type: 'eventora-ticket',
    version: 1,
    ticketId: ticket.id,
    token: ticket.qrToken,
    eventId: ticket.eventId,
    societyId: ticket.societyId,
  })
}

export async function createTicketQrDataUrl(ticket) {
  return QRCode.toDataURL(buildTicketQrPayload(ticket), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 220,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })
}

export function parseTicketQrPayload(rawPayload) {
  try {
    const payload = JSON.parse(rawPayload)

    if (payload?.type !== 'eventora-ticket' || payload?.version !== 1) {
      return null
    }

    return payload
  } catch {
    return {
      token: rawPayload,
    }
  }
}
