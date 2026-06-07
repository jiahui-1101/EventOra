let pendingEvents = [
  { id: 101, society: "Robotics Club", title: "Line Follower Workshop", date: "2026-07-10", category: "Academic", capacity: 30 },
  { id: 102, society: "Entrepreneurship Society", title: "Startup Pitch Night", date: "2026-07-15", category: "Academic", capacity: 50 },
  { id: 103, society: "Music Club", title: "Acoustic Night", date: "2026-07-18", category: "Cultural", capacity: 80 }
];

let rejectTargetId = null;

function renderQueue() {
  const tbody = document.getElementById("pendingEventsList");
  tbody.innerHTML = pendingEvents.map(ev => `
    <tr style="border-bottom:1px solid var(--border);">
      <td>${ev.society}</td>
      <td>${ev.title}</td>
      <td>${ev.date}</td>
      <td>${ev.category}</td>
      <td>${ev.capacity}</td>
      <td>
        <button class="button button-success" data-id="${ev.id}" data-action="approve">✓ Approve</button>
        <button class="button button-danger" data-id="${ev.id}" data-action="reject" data-title="${ev.title}" data-society="${ev.society}" style="margin-left:6px;">✕ Reject</button>
      </td>
    </tr>
  `).join('');

  // Approve buttons
  document.querySelectorAll('[data-action="approve"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      pendingEvents = pendingEvents.filter(ev => ev.id !== id);
      renderQueue();
      updatePendingCount();
      showToast("Event approved successfully!", "success");
    });
  });

  // Reject buttons — open modal
  document.querySelectorAll('[data-action="reject"]').forEach(btn => {
    btn.addEventListener("click", () => {
      rejectTargetId = parseInt(btn.dataset.id);
      document.getElementById("rejectEventTitle").textContent = btn.dataset.title;
      document.getElementById("rejectEventSociety").textContent = btn.dataset.society;
      document.getElementById("rejectReason").value = "";
      document.getElementById("rejectModal").style.display = "flex";
    });
  });
}

function updatePendingCount() {
  const badge = document.querySelector(".badge-yellow");
  if (badge) badge.textContent = `${pendingEvents.length} pending`;
}

// Modal: Cancel
document.getElementById("cancelRejectBtn").addEventListener("click", () => {
  document.getElementById("rejectModal").style.display = "none";
  rejectTargetId = null;
});

// Modal: Confirm reject
document.getElementById("confirmRejectBtn").addEventListener("click", () => {
  const reason = document.getElementById("rejectReason").value.trim();
  if (!reason) {
    document.getElementById("rejectReason").style.borderColor = "var(--danger)";
    return;
  }
  pendingEvents = pendingEvents.filter(ev => ev.id !== rejectTargetId);
  document.getElementById("rejectModal").style.display = "none";
  rejectTargetId = null;
  renderQueue();
  updatePendingCount();
  showToast("Event rejected. Organiser has been notified.", "danger");
});

// Toast notification
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

renderQueue();