const STORAGE_KEY = "eventora_checkin_tickets";
const MY_USER = "Aina Rahman";

const defaultTickets = [
  {
    id: "EVT-9F4K-2Q8M-X7P1",
    qrToken: "qr_8vK29pLmQ4xT7nB6zR1s",
    attendeeName: "Aina Rahman",
    eventName: "Build Your First AI App",
    eventDate: "12 Jun 2026",
    eventTime: "7:30 PM",
    location: "N28A Innovation Lab",
    societyId: "UTM-CS",
    status: "confirmed",
    checkedInAt: null,
    checkedInBy: null
  },
  {
    id: "EVT-6B1P-8Q2N-R4Z9",
    qrToken: "qr_6b1p8q2nr4z9past",
    attendeeName: "Aina Rahman",
    eventName: "Vue 3 Crash Course",
    eventDate: "18 May 2026",
    eventTime: "2:00 PM",
    location: "Seminar Room 2",
    societyId: "UTM-CS",
    status: "used",
    checkedInAt: "2:14 PM",
    checkedInBy: "Nurul Admin"
  }
];

function loadTickets() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (Array.isArray(saved) && saved.length) return saved;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTickets));
  return defaultTickets;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMyTickets() {
  return loadTickets().filter(ticket => ticket.attendeeName === MY_USER);
}

function renderQrPattern(isUsed) {
  return `
    <div class="qr-pattern ${isUsed ? "used" : ""}" aria-label="${isUsed ? "Used QR ticket code" : "QR ticket code"}">
      ${Array.from({ length: 16 }, () => "<span></span>").join("")}
    </div>
  `;
}

function renderTicketCard(ticket) {
  const isUsed = ticket.status === "used";
  const eventLine = `${escapeHtml(ticket.eventDate)} · ${escapeHtml(ticket.eventTime)} · ${escapeHtml(ticket.location)}`;
  const qrStatus = isUsed ? "Used and locked" : escapeHtml(ticket.qrToken);

  return `
    <article class="ticket-card ${isUsed ? "muted-ticket" : "ticket-pass"}">
      <div class="ticket-info">
        <div class="ticket-topline">
          <span class="badge ${isUsed ? "badge-gray" : "badge-green"}">${isUsed ? "Used" : "Active"}</span>
          <span>${isUsed ? "Checked in" : "Confirmed after payment"}</span>
        </div>
        <h3>${escapeHtml(ticket.eventName || "Event")}</h3>
        <p>${eventLine}</p>
        <div class="ticket-meta">
          <span>Ticket ID <strong>${escapeHtml(ticket.id)}</strong></span>
          <span>Seat type <strong>Student</strong></span>
          <span>Gate <strong>Lab Entrance</strong></span>
          <span>Check-in <strong>${isUsed ? `Used at ${escapeHtml(ticket.checkedInAt)}` : "Not used"}</strong></span>
        </div>
        <div class="ticket-security">
          <div>
            <span>Unique ticket code</span>
            <code>${escapeHtml(ticket.id)}</code>
          </div>
          <div>
            <span>QR token status</span>
            <code>${qrStatus}</code>
          </div>
        </div>
        ${isUsed ? "" : `
          <div class="ticket-actions">
            <span>Cancel registration</span>
            <span>Add to calendar</span>
          </div>
        `}
      </div>
      <div class="ticket-divider" aria-hidden="true"></div>
      <div class="qr-zone">
        ${renderQrPattern(isUsed)}
        <strong>${isUsed ? "Already checked in" : "Scan at entrance"}</strong>
        <small>${isUsed ? "Cannot be reused" : "Valid for this event only"}</small>
      </div>
    </article>
  `;
}

function renderEmptyTicket(message) {
  return `<article class="ticket-empty">${message}</article>`;
}

function renderTickets() {
  const myTickets = getMyTickets();
  const upcoming = myTickets.filter(ticket => ticket.status === "confirmed");
  const past = myTickets.filter(ticket => ticket.status === "used");

  const upcomingEl = document.getElementById("upcomingTickets");
  const pastEl = document.getElementById("pastTickets");

  if (upcomingEl) {
    upcomingEl.innerHTML = upcoming.length
      ? upcoming.map(renderTicketCard).join("")
      : renderEmptyTicket("No upcoming tickets.");
  }

  if (pastEl) {
    pastEl.innerHTML = past.length
      ? past.map(renderTicketCard).join("")
      : renderEmptyTicket("No past tickets.");
  }
}

document.addEventListener("DOMContentLoaded", renderTickets);
