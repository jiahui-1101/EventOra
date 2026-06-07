const defaultEvents = [
  {
    id: 1,
    title: "Build Your First AI App",
    category: "Academic",
    location: "N28A Innovation Lab",
    eventDate: "12 Jun 2026",
    startTime: "7:30 PM",
    endTime: "9:30 PM",
    feeType: "Paid",
    feeAmount: 8,
    status: "published",
    registrations: 28,
    checkedIn: 18,
    avgRating: 4.5,
    capacity: 40
  },
  {
    id: 2,
    title: "Hackathon 2026",
    category: "Academic",
    location: "FAB Lab",
    eventDate: "5 Jul 2026",
    startTime: "9:00 AM",
    endTime: "6:00 PM",
    feeType: "Paid",
    feeAmount: 15,
    status: "pending_approval",
    registrations: 0,
    checkedIn: 0,
    avgRating: null,
    capacity: 60
  },
  {
    id: 3,
    title: "Futsal Tournament",
    category: "Sports",
    location: "UTM Sports Hall",
    eventDate: "28 Jun 2026",
    startTime: "9:00 AM",
    endTime: "1:00 PM",
    feeType: "Free",
    feeAmount: 0,
    status: "published",
    registrations: 40,
    checkedIn: 32,
    avgRating: 4.2,
    capacity: 40
  }
];

const registrationsList = [
  { name: "Aina Rahman", email: "aina@utm.my", status: "confirmed", ticketCode: "EVT-9F4K-2Q8M-X7P1" },
  { name: "Nurul Iman", email: "nurul@utm.my", status: "confirmed", ticketCode: "EVT-3H7J-1L9N-P5R2" },
  { name: "Kevin Tan", email: "kevin@utm.my", status: "waitlist", ticketCode: "" }
];

const attendanceList = [
  { attendee: "Aina Rahman", checkedInAt: "7:18 PM, 12 Jun", verifiedBy: "Mei Shuet" },
  { attendee: "Nurul Iman", checkedInAt: "7:22 PM, 12 Jun", verifiedBy: "Mei Shuet" }
];

const feedbackData = [
  { rating: 5, comment: "Excellent workshop!" },
  { rating: 4, comment: "Good but short" },
  { rating: 5, comment: "Very inspiring" }
];

const eventsStorageKey = "eventora_society_events_v2";
let societyEvents = JSON.parse(localStorage.getItem(eventsStorageKey) || "null") || defaultEvents;
let editingEventId = null;

function saveEvents() {
  localStorage.setItem(eventsStorageKey, JSON.stringify(societyEvents));
}

function badgeForStatus(status) {
  if (status === "published") return "badge-green";
  if (status === "pending_approval") return "badge-yellow";
  if (status === "completed") return "badge-purple";
  if (status === "rejected" || status === "cancelled") return "badge-red";
  return "badge-blue";
}

function statusLabel(status) {
  return status.replace("_", " ");
}

function renderWorkflowActions(event) {
  return `
    <a class="button button-secondary" href="organiser-event-detail.html?event=${event.id}">
      Edit
    </a>
  `;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderStats() {
  const stats = document.querySelectorAll(".od-stat-card strong");
  const published = societyEvents.filter(ev => ev.status === "published").length;
  const pending = societyEvents.filter(ev => ev.status === "pending_approval").length;
  const totalRegistrations = societyEvents.reduce((sum, ev) => sum + ev.registrations, 0);
  const totalCheckedIn = societyEvents.reduce((sum, ev) => sum + ev.checkedIn, 0);
  const ratings = societyEvents.filter(ev => ev.avgRating).map(ev => ev.avgRating);
  const avgRating = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "0.0";

  if (stats[0]) stats[0].textContent = societyEvents.length;
  if (stats[1]) stats[1].textContent = totalRegistrations;
  if (stats[2]) stats[2].textContent = totalCheckedIn;
  if (stats[3]) stats[3].textContent = `${avgRating} ★`;

  const descriptions = document.querySelectorAll(".od-stat-card p");
  if (descriptions[0]) descriptions[0].textContent = `${published} published · ${pending} pending`;
  if (descriptions[2]) descriptions[2].textContent = `${totalRegistrations ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0}% attendance rate`;
}

function renderEventsTab() {
  return `
    <div class="page-section">
      <div class="section-heading">
        <h2>My Events</h2>
        <a class="button button-primary" href="create-event.html">+ Create Event</a>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Date</th>
              <th>Capacity</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${societyEvents.map(ev => `
              <tr>
                <td>
                  <a href="organiser-event-detail.html?event=${ev.id}" style="font-weight:700;color:var(--text);text-decoration:none;">
                  ${ev.title}
                  </a>
                  <span class="badge ${ev.category === "Sports" ? "badge-yellow" : "badge-blue"}" style="font-size:0.68rem;margin-top:6px;">
                    ${ev.category || "Academic"}
                  </span>
                </td>
                <td>
                ${ev.eventDate || "Not set"}
                <br>
                <span style="color:var(--muted);font-size:0.78rem;">
                ${ev.startTime || "--"} - ${ev.endTime || "--"}
                </span>
                </td>
                <td>${ev.capacity}</td>
                <td>
                  ${ev.registrations}
                  <span style="color:var(--muted);font-size:0.78rem;">
                    (${ev.capacity ? Math.round((ev.registrations / ev.capacity) * 100) : 0}%)
                  </span>
                </td>
                <td>
                  <span class="badge ${badgeForStatus(ev.status)}">${statusLabel(ev.status)}</span>
                </td>
                <td>${renderWorkflowActions(ev)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderRegistrationsTab() {
  return `
    <div class="page-section">
      <div class="section-heading">
        <h2>Registrations</h2>
        <button class="button button-primary" id="exportRegistrationsCSV">Export CSV</button>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Ticket Code</th></tr></thead>
          <tbody>
            ${registrationsList.map(r => `
              <tr>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td><span class="badge ${r.status === "confirmed" ? "badge-green" : "badge-yellow"}">${r.status}</span></td>
                <td><code>${r.ticketCode || "-"}</code></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderAttendanceTab() {
  const checkedIn = attendanceList.length;
  const registered = registrationsList.filter(r => r.status === "confirmed").length;
  const rate = registered ? Math.round((checkedIn / registered) * 100) : 0;

  return `
    <div class="page-section">
      <div class="section-heading">
        <div>
          <h2>Attendance Report</h2>
          <p style="color:var(--muted);margin:4px 0 0;">${checkedIn} / ${registered} confirmed attendees checked in</p>
        </div>
        <button class="button button-primary" id="exportAttendanceCSV">Export Attendance CSV</button>
      </div>
      <div class="capacity-bar" style="margin-bottom:1rem;"><span style="width:${rate}%"></span></div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Attendee</th><th>Checked In At</th><th>Verified By</th></tr></thead>
          <tbody>${attendanceList.map(a => `<tr><td>${a.attendee}</td><td>${a.checkedInAt}</td><td>${a.verifiedBy}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </div>`;
}

function renderFeedbackTab() {
  const avg = (feedbackData.reduce((sum, item) => sum + item.rating, 0) / feedbackData.length).toFixed(1);
  return `
    <div class="page-section">
      <div class="section-heading">
        <div>
          <h2>Feedback & Ratings</h2>
          <p style="color:var(--muted);margin:4px 0 0;">Average Rating: <strong>${avg} / 5</strong> from ${feedbackData.length} reviews</p>
        </div>
        <button class="button button-primary" id="exportFeedbackCSV">Export Feedback CSV</button>
      </div>
      <div class="event-grid">
        ${feedbackData.map(f => `
          <article class="event-card">
            <div class="event-card-body">
              <strong>${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</strong>
              <p>${f.comment}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </div>`;
}

function openEventModal(event = null) {
  editingEventId = event?.id || null;
  document.getElementById("eventModalTitle").textContent = event ? "Edit Event" : "Create Event";
  document.getElementById("eventModalEyebrow").textContent = event ? "Update event details" : "New event draft";
  document.getElementById("eventTitleInput").value = event?.title || "";
  document.getElementById("eventCapacityInput").value = event?.capacity || "";
  document.getElementById("eventStatusInput").value = event?.status || "draft";
  document.getElementById("eventFormError").style.display = "none";
  document.getElementById("eventModal").style.display = "flex";
}

function closeEventModal() {
  document.getElementById("eventModal").style.display = "none";
  editingEventId = null;
}

function saveEventFromModal() {
  const title = document.getElementById("eventTitleInput").value.trim();
  const capacity = Number(document.getElementById("eventCapacityInput").value);
  const status = document.getElementById("eventStatusInput").value;
  const errorDiv = document.getElementById("eventFormError");

  errorDiv.style.display = "none";

  if (!title || !capacity || capacity < 1) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Event title and a valid capacity are required.";
    return;
  }

  if (editingEventId) {
    societyEvents = societyEvents.map(ev => ev.id === editingEventId ? { ...ev, title, capacity, status } : ev);
  } else {
    societyEvents.push({
      id: Date.now(),
      title,
      capacity,
      status,
      registrations: 0,
      checkedIn: 0,
      avgRating: null
    });
  }

  saveEvents();
  closeEventModal();
  renderCurrentTab("events");
}

function cancelEvent(id) {
  societyEvents = societyEvents.map(ev => ev.id === id ? { ...ev, status: "cancelled" } : ev);
  saveEvents();
  renderCurrentTab("events");
}

function deleteEvent(id) {
  societyEvents = societyEvents.filter(ev => ev.id !== id);
  saveEvents();
  renderCurrentTab("events");
}

function bindTabActions(tab) {
  if (tab === "events") {
    document.querySelectorAll(".edit-event-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const event = societyEvents.find(ev => ev.id === Number(btn.dataset.id));
        openEventModal(event);
      });
    });
    document.querySelectorAll(".cancel-event-btn").forEach(btn => {
      btn.addEventListener("click", () => cancelEvent(Number(btn.dataset.id)));
    });
    document.querySelectorAll(".delete-event-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteEvent(Number(btn.dataset.id)));
    });
  }

  if (tab === "registrations") {
    document.getElementById("exportRegistrationsCSV")?.addEventListener("click", () => exportCSV(registrationsList, "registrations.csv"));
  }

  if (tab === "attendance") {
    document.getElementById("exportAttendanceCSV")?.addEventListener("click", () => exportCSV(attendanceList, "attendance.csv"));
  }

  if (tab === "feedback") {
    document.getElementById("exportFeedbackCSV")?.addEventListener("click", () => exportCSV(feedbackData, "feedback.csv"));
  }
}

function renderCurrentTab(tab) {
  const content = document.getElementById("dashboardContent");
  if (tab === "events") content.innerHTML = renderEventsTab();
  if (tab === "registrations") content.innerHTML = renderRegistrationsTab();
  if (tab === "attendance") content.innerHTML = renderAttendanceTab();
  if (tab === "feedback") content.innerHTML = renderFeedbackTab();
  renderStats();
  bindTabActions(tab);
}

function addCreatedEventToDashboard(status) {
  const mockCreatedId = "created-event-annual-tech-symposium";

  const alreadyAdded = societyEvents.some(ev => ev.mockId === mockCreatedId);
  if (alreadyAdded) return;

  societyEvents.unshift({
    id: Date.now(),
    mockId: mockCreatedId,
    title: "Annual Tech Symposium 2026",
    category: "Academic",
    location: "Dewan Sultan Iskandar, UTM JB",
    eventDate: "15 Jul 2026",
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    feeType: "Free",
    feeAmount: 0,
    status,
    registrations: 0,
    checkedIn: 0,
    avgRating: null,
    capacity: 120
  });

  saveEvents();
  renderCurrentTab("events");
}

function showCreateEventToast() {
  const params = new URLSearchParams(window.location.search);
  const eventSaved = params.get("eventSaved");
  const eventAction = params.get("eventAction");
  if (!eventSaved && !eventAction) return;

  const toast = document.getElementById("dashboardToast");
  const title = document.getElementById("dashboardToastTitle");
  const message = document.getElementById("dashboardToastMessage");

  if (!toast || !title || !message) return;

  if (eventSaved === "draft") {
    title.textContent = "Draft saved successfully";
    message.textContent = "The event is saved as a draft and can be edited before submission.";
    addCreatedEventToDashboard("draft");
  }

  if (eventSaved === "submitted") {
    title.textContent = "Event submitted for approval";
    message.textContent = "Faculty Admin will review the event before it appears in the public list.";
    addCreatedEventToDashboard("pending_approval");
  }

  if (eventAction === "submitted") {
    title.textContent = "Event submitted for approval";
    message.textContent = "The event moved from draft to pending approval for Faculty Admin review.";
  }

  if (eventAction === "deleted") {
    title.textContent = "Draft deleted";
    message.textContent = "The draft event has been removed from the organiser workspace.";
  }

  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
    window.history.replaceState({}, document.title, window.location.pathname);
  }, 3500);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCurrentTab("events");
  showCreateEventToast();

  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      document.querySelectorAll(".sidebar-nav a").forEach(item => item.classList.remove("active"));
      link.classList.add("active");
      renderCurrentTab(link.dataset.tab);
    });
  });

  document.getElementById("closeEventModalBtn").addEventListener("click", closeEventModal);
  document.getElementById("saveEventBtn").addEventListener("click", saveEventFromModal);
});
