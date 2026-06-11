const TICKET_STORAGE_KEY = "eventora_checkin_tickets";
const CURRENT_ATTENDEE_KEY = "eventora_current_attendee";
const MOCK_CARD = "4242 4242 4242 4242";
const ATTENDEE_NAME = "Wong Jia Hui";

function normaliseCardNumber(value) {
  return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function randomTicketCode() {
  const segment = length => Math.random().toString(36).slice(2, 2 + length).toUpperCase();
  return `EVT-${segment(4)}-${segment(4)}-${segment(2)}${Math.floor(Math.random() * 9) + 1}`;
}

function randomQrToken() {
  return `qr_${Math.random().toString(36).slice(2, 22)}`;
}

function readTickets() {
  const saved = JSON.parse(localStorage.getItem(TICKET_STORAGE_KEY) || "[]");
  return Array.isArray(saved) ? saved : [];
}

function saveTickets(tickets) {
  localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
}

function createTicket() {
  return {
    id: randomTicketCode(),
    qrToken: randomQrToken(),
    attendeeName: ATTENDEE_NAME,
    eventId: 1,
    eventName: "Build Your First AI App",
    eventDate: "12 Jun 2026",
    eventTime: "7:30 PM",
    location: "N28A Innovation Lab",
    societyId: "UTM-CS",
    status: "confirmed",
    checkedInAt: null,
    checkedInBy: null
  };
}

function setSelectedPaymentMethod(button) {
  document.querySelectorAll(".payment-option").forEach(option => option.classList.remove("selected"));
  button.classList.add("selected");

  const methodLabel = document.getElementById("selectedPaymentMethod");
  if (methodLabel) methodLabel.textContent = `${button.dataset.method} ending 4242`;
}

function showResult(type, ticket = null) {
  const modal = document.querySelector(".modal-card");
  const result = document.getElementById("paymentResult");
  if (!result) return;

  if (type === "success") {
    if (modal) modal.style.display = "none";
    result.style.display = "block";
    result.innerHTML = `
      <article class="state-card success-state payment-result-card">
        <span class="status-dot"></span>
        <div>
          <span class="badge badge-green">Payment approved</span>
          <h3>QR Ticket generated</h3>
          <p>Your registration is confirmed. Ticket <code>${ticket.id}</code> is now active in My Tickets.</p>
          <div class="payment-result-actions">
            <a href="tickets.html" class="button button-primary">View My Tickets</a>
            <a href="../../index.html" class="button button-secondary">Back to Events</a>
          </div>
        </div>
      </article>
    `;
    return;
  }

  result.style.display = "block";
  result.innerHTML = `
    <article class="state-card danger-state payment-result-card">
      <span class="status-dot"></span>
      <div>
        <span class="badge badge-red">Payment declined</span>
        <h3>No ticket generated</h3>
        <p>Your payment was not approved. No QR ticket has been created. Please retry with a valid card.</p>
        <button id="retryPaymentBtn" class="button button-secondary" type="button">Try again</button>
      </div>
    </article>
  `;

  document.getElementById("retryPaymentBtn")?.addEventListener("click", () => {
    result.style.display = "none";
    document.getElementById("cardInput")?.focus();
  });
}

function approvePayment() {
  const cardInput = document.getElementById("cardInput");
  const cardError = document.getElementById("cardError");
  const card = normaliseCardNumber(cardInput?.value || "");

  if (card !== MOCK_CARD) {
    if (cardError) cardError.style.display = "block";
    return;
  }

  if (cardError) cardError.style.display = "none";

  const ticket = createTicket();
  const tickets = readTickets();
  tickets.push(ticket);
  saveTickets(tickets);
  localStorage.setItem(CURRENT_ATTENDEE_KEY, ATTENDEE_NAME);
  showResult("success", ticket);
}

function declinePayment() {
  showResult("declined");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".payment-option").forEach(button => {
    button.addEventListener("click", () => setSelectedPaymentMethod(button));
  });

  document.getElementById("cardInput")?.addEventListener("input", event => {
    event.target.value = normaliseCardNumber(event.target.value).slice(0, 19);
    document.getElementById("cardError").style.display = "none";
  });

  document.getElementById("approveBtn")?.addEventListener("click", approvePayment);
  document.getElementById("declineBtn")?.addEventListener("click", declinePayment);
});
