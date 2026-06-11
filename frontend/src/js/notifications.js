const defaultNotifications = [
  {
    id: 1,
    audience: "attendee",
    type: "Registration",
    title: "Registration successful",
    message: "You have successfully registered for Build Your First AI App.",
    time: "Today, 10:20 AM",
    badgeClass: "badge-green",
    unread: true
  },
  {
    id: 2,
    audience: "attendee",
    type: "Payment",
    title: "Mock payment successful",
    message: "Your RM 8 mock payment for Build Your First AI App has been completed.",
    time: "Today, 10:22 AM",
    badgeClass: "badge-green",
    unread: true
  },
  {
    id: 3,
    audience: "attendee",
    type: "Waitlist",
    title: "Waitlist seat confirmed",
    message: "A seat opened for Interfaculty Futsal Cup. Your waitlist status has been converted to confirmed.",
    time: "Yesterday, 4:15 PM",
    badgeClass: "badge-blue",
    unread: true
  },
  {
    id: 4,
    audience: "attendee",
    type: "Cancellation",
    title: "Event cancelled",
    message: "Campus Cultural Night was cancelled by the organiser. Your registration is no longer active.",
    time: "6 Jun 2026, 9:00 AM",
    badgeClass: "badge-red",
    unread: false
  },
  {
    id: 5,
    audience: "attendee",
    type: "Reminder",
    title: "Event starts soon",
    message: "Build Your First AI App starts tomorrow at 7:30 PM at N28A Innovation Lab.",
    time: "5 Jun 2026, 8:00 PM",
    badgeClass: "badge-purple",
    unread: true
  },
  {
    id: 6,
    audience: "organiser",
    type: "Approval",
    title: "Event approved",
    message: "Hackathon 2026 has been approved by Faculty Admin and can now appear in the public event list.",
    time: "Yesterday, 2:30 PM",
    badgeClass: "badge-green",
    unread: true
  },
  {
    id: 7,
    audience: "organiser",
    type: "Approval",
    title: "Event rejected",
    message: "Acoustic Night was rejected by Faculty Admin. Reason: venue booking confirmation is missing.",
    time: "5 Jun 2026, 3:40 PM",
    badgeClass: "badge-red",
    unread: true
  },
  {
    id: 8,
    audience: "organiser",
    type: "Cancellation",
    title: "Event cancelled",
    message: "You cancelled Build Your First AI App. Registered attendees have been notified.",
    time: "6 Jun 2026, 9:10 AM",
    badgeClass: "badge-red",
    unread: false
  },
  {
    id: 9,
    audience: "faculty_admin",
    type: "Approval",
    title: "New event pending approval",
    message: "Line Follower Workshop submitted by Robotics Club is waiting for Faculty Admin review.",
    time: "Today, 9:45 AM",
    badgeClass: "badge-yellow",
    unread: true
  }
];

const storageKey = "eventora_notifications";
const savedNotifications = JSON.parse(localStorage.getItem(storageKey) || "null");

let notifications = Array.isArray(savedNotifications) && savedNotifications.every(item => item.audience)
  ? savedNotifications
  : defaultNotifications;

function saveNotifications() {
  localStorage.setItem(storageKey, JSON.stringify(notifications));
}

function currentRole() {
  const session = JSON.parse(localStorage.getItem("eventora_session") || "null");
  return session?.user?.role || localStorage.getItem("userRole") || "attendee";
}

function visibleNotifications() {
  const role = currentRole();
  return notifications.filter(notification => notification.audience === role);
}

function unreadCount() {
  return visibleNotifications().filter(notification => notification.unread).length;
}

function updateBadges() {
  const count = unreadCount();
  const unreadSummary = document.getElementById("unreadSummary");
  const navUnreadBadge = document.getElementById("navUnreadBadge");

  unreadSummary.textContent = `${count} unread`;
  navUnreadBadge.textContent = count;
  navUnreadBadge.style.display = count ? "inline-flex" : "none";
}

function renderNotifications() {
  const list = document.getElementById("notificationList");
  const visible = visibleNotifications();

  if (!visible.length) {
    list.innerHTML = `
      <article class="notification-item read">
        <span class="unread-dot" aria-hidden="true"></span>
        <div class="notification-content">
          <h3>No notifications</h3>
          <p>You do not have any notifications for this role yet.</p>
          <div class="notification-meta">
            <span class="badge badge-gray">Empty</span>
          </div>
        </div>
      </article>
    `;
    updateBadges();
    return;
  }

  list.innerHTML = visible.map(notification => `
    <article class="notification-item ${notification.unread ? "unread" : "read"}">
      <span class="unread-dot" aria-hidden="true"></span>

      <div class="notification-content">
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
        <div class="notification-meta">
          <span class="badge ${notification.badgeClass}">${notification.type}</span>
          <span style="color:var(--muted);font-size:0.82rem;">${notification.time}</span>
          <span class="badge ${notification.unread ? "badge-blue" : "badge-gray"}">
            ${notification.unread ? "Unread" : "Read"}
          </span>
        </div>
      </div>

      <div class="notification-actions">
        ${
          notification.unread
            ? `<button class="button button-secondary mark-read-btn" data-id="${notification.id}">Mark as read</button>`
            : `<span class="badge badge-gray">Done</span>`
        }
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".mark-read-btn").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);

      notifications = notifications.map(notification =>
        notification.id === id ? { ...notification, unread: false } : notification
      );

      saveNotifications();
      renderNotifications();
    });
  });

  updateBadges();
}

document.getElementById("markAllReadBtn").addEventListener("click", () => {
  const role = currentRole();

  notifications = notifications.map(notification =>
    notification.audience === role ? { ...notification, unread: false } : notification
  );

  saveNotifications();
  renderNotifications();
});

saveNotifications();
renderNotifications();