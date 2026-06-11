const STORAGE_KEY = "eventora_checkin_tickets";
const CURRENT_ORGANISER_SOCIETY = "UTM-CS";
const CURRENT_ORGANISER_NAME = "Nurul Admin";

const defaultTickets = [
  {
    id: "EVT-9F4K-2Q8M-X7P1",
    qrToken: "qr_8vK29pLmQ4xT7nB6zR1s",
    attendeeName: "Aina Rahman",
    eventId: 1,
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
    id: "EVT-3H7J-1L9N-P5R2",
    qrToken: "qr_2mX91rNpL8vK4tB7zS3q",
    attendeeName: "Nurul Iman",
    eventId: 1,
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
    id: "EVT-7Z3M-4Q1N-K9P5",
    qrToken: "qr_5wR14mKpJ7xN2tC8zB6h",
    attendeeName: "Ahmad Faiz",
    eventId: 2,
    eventName: "Robotics Showcase",
    eventDate: "19 Jun 2026",
    eventTime: "3:00 PM",
    location: "FAB Lab",
    societyId: "UTM-ROBOTICS",
    status: "confirmed",
    checkedInAt: null,
    checkedInBy: null
  },
  {
    id: "EVT-2C8R-6V4L-T1W3",
    qrToken: "qr_4hT82nQpV1zR9mK6sX7c",
    attendeeName: "Mei Shuet",
    eventId: 1,
    eventName: "Build Your First AI App",
    eventDate: "12 Jun 2026",
    eventTime: "7:30 PM",
    location: "N28A Innovation Lab",
    societyId: "UTM-CS",
    status: "cancelled",
    checkedInAt: null,
    checkedInBy: null
  },
  {
    id: "EVT-6B1P-8Q2N-R4Z9",
    qrToken: "qr_6b1p8q2nr4z9past",
    attendeeName: "Aina Rahman",
    eventId: 3,
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

let tickets = loadTickets();

function loadTickets() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (Array.isArray(saved) && saved.length) return saved;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTickets));
  return [...defaultTickets];
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function normalizeCode(code) {
  return code.trim();
}

function processCheckIn(code) {
  const normalizedCode = normalizeCode(code);
  const ticket = tickets.find(item => item.id.toUpperCase() === normalizedCode.toUpperCase() || item.qrToken === normalizedCode);

  if (!ticket || ticket.status === "cancelled") {
    return { result: "invalid", message: "Ticket code was not found or has been cancelled." };
  }

  if (ticket.societyId !== CURRENT_ORGANISER_SOCIETY) {
    return {
      result: "wrong_society",
      message: `This ticket belongs to ${ticket.societyId} and cannot be scanned here.`,
      ticket
    };
  }

  if (ticket.status === "used") {
    return {
      result: "duplicate",
      message: `${ticket.attendeeName} was already checked in at ${ticket.checkedInAt}.`,
      ticket
    };
  }

  ticket.status = "used";
  ticket.checkedInAt = new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  ticket.checkedInBy = CURRENT_ORGANISER_NAME;
  saveTickets();

  return {
    result: "success",
    attendeeName: ticket.attendeeName,
    message: `${ticket.attendeeName} has been marked present for ${ticket.eventName}.`,
    ticket
  };
}

function showResult(outcome) {
  const panel = document.getElementById("lastScanResult");
  if (!panel) return;

  const stateMap = {
    success: { cls: "success-state", label: "Success", title: "Check-in successful" },
    invalid: { cls: "danger-state", label: "Blocked", title: "Invalid ticket" },
    wrong_society: { cls: "warning-state", label: "Permission mismatch", title: "Wrong society" },
    duplicate: { cls: "neutral-state", label: "Duplicate scan", title: "Already checked in" }
  };
  const state = stateMap[outcome.result] || stateMap.invalid;
  const timeNote = outcome.result === "success" ? `<span class="result-note">Checked in at ${outcome.ticket.checkedInAt}</span>` : "";

  panel.className = `result-card ${state.cls}`;
  panel.innerHTML = `
    <span class="result-label">${state.label}</span>
    <strong>${state.title}</strong>
    <p>${outcome.message}</p>
    ${timeNote}
  `;
}

function updateReceipt(outcome) {
  const receipt = document.getElementById("scanReceipt");
  const badge = document.getElementById("receiptBadge");
  const name = document.getElementById("receiptName");
  const event = document.getElementById("receiptEvent");
  const ticketCode = document.getElementById("receiptTicket");
  const scanner = document.getElementById("receiptScanner");
  const time = document.getElementById("receiptTime");

  if (!receipt || !badge || !name || !event || !ticketCode || !scanner || !time) return;

  receipt.classList.toggle("success-receipt", outcome.result === "success");
  badge.className = `badge ${outcome.result === "success" ? "badge-green" : "badge-gray"}`;
  badge.textContent = outcome.result === "success" ? "Checked in" : "Not checked in";
  name.textContent = outcome.ticket?.attendeeName || "Scan blocked";
  event.textContent = outcome.ticket
    ? `${outcome.ticket.eventName} · ${outcome.ticket.eventDate} · ${outcome.ticket.location}`
    : outcome.message;
  ticketCode.textContent = outcome.ticket?.id || "-";
  scanner.textContent = outcome.ticket?.checkedInBy || "-";
  time.textContent = outcome.ticket?.checkedInAt || "-";
}

function updateStats() {
  const societyTickets = tickets.filter(ticket => ticket.societyId === CURRENT_ORGANISER_SOCIETY && ticket.status !== "cancelled");
  const checkedIn = societyTickets.filter(ticket => ticket.status === "used").length;
  const registered = societyTickets.length;
  const rate = registered ? Math.round((checkedIn / registered) * 100) : 0;

  document.getElementById("statCheckedIn").textContent = checkedIn;
  document.getElementById("statRegistered").textContent = registered;

  const rateEl = document.querySelector(".attendance-rate");
  if (rateEl) rateEl.textContent = `${rate}%`;

  const summaryEl = document.querySelector(".attendance-panel p");
  if (summaryEl) summaryEl.textContent = `${checkedIn} checked in from ${registered} confirmed registrations.`;
}

function handleManualCheckIn() {
  const input = document.getElementById("manualTicketInput");
  const code = input.value.trim();
  if (!code) {
    showResult({ result: "invalid", message: "Enter a ticket code before checking in." });
    return;
  }

  const outcome = processCheckIn(code);
  showResult(outcome);
  updateReceipt(outcome);
  updateStats();
}

document.addEventListener("DOMContentLoaded", () => {
  updateStats();

  document.getElementById("checkInBtn")?.addEventListener("click", handleManualCheckIn);
  document.getElementById("manualTicketInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") handleManualCheckIn();
  });
});
