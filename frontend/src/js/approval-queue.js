let approvalEvents = [
  {
    id: 101,
    society: "Robotics Club",
    title: "Line Follower Workshop",
    date: "2026-07-10",
    category: "Academic",
    capacity: 30,
    status: "pending"
  },
  {
    id: 102,
    society: "Entrepreneurship Society",
    title: "Startup Pitch Night",
    date: "2026-07-15",
    category: "Academic",
    capacity: 50,
    status: "approved"
  },
  {
    id: 103,
    society: "Music Club",
    title: "Acoustic Night",
    date: "2026-07-18",
    category: "Cultural",
    capacity: 80,
    status: "rejected",
    reason: "Venue booking confirmation is missing."
  }
];

function statusBadge(status) {
  if (status === "approved") {
    return `<span class="badge badge-green">Approved</span>`;
  }

  if (status === "rejected") {
    return `<span class="badge badge-red">Rejected</span>`;
  }

  return `<span class="badge badge-yellow">Pending</span>`;
}

function renderQueue() {
  const tbody = document.getElementById("pendingEventsList");

  tbody.innerHTML = approvalEvents.map(ev => `
    <tr style="border-bottom:1px solid var(--border);">
      <td>${ev.society}</td>
      <td>
        <strong>${ev.title}</strong>
        ${ev.reason ? `<div style="color:var(--muted);font-size:0.78rem;margin-top:4px;">Reason: ${ev.reason}</div>` : ""}
      </td>
      <td>${ev.date}</td>
      <td>${ev.category}</td>
      <td>${ev.capacity}</td>
      <td>${statusBadge(ev.status)}</td>
      <td>
        <a class="button button-secondary" href="approval-detail.html?event=${ev.id}">
          View Details
        </a>
      </td>
    </tr>
  `).join("");

  updatePendingCount();
}

function updatePendingCount() {
  const pending = approvalEvents.filter(ev => ev.status === "pending").length;
  const badge = document.querySelector(".badge-yellow");
  if (badge) badge.textContent = `${pending} pending`;
}

function showToast(message, type) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;padding:14px 20px;
    border-radius:var(--radius-sm);color:#fff;font-size:0.88rem;font-weight:600;
    background:${type === "success" ? "var(--success)" : "var(--danger)"};
    box-shadow:var(--shadow-lg);z-index:9999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

const params = new URLSearchParams(window.location.search);
const adminAction = params.get("adminAction");

if (adminAction === "approved") {
  showToast("Event approved successfully.", "success");
}

if (adminAction === "rejected") {
  showToast("Event rejected. Reason has been recorded.", "danger");
}

renderQueue();