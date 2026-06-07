function getNavPaths() {
  const inPagesFolder = window.location.pathname.includes("/src/pages/");

  return {
    home: inPagesFolder ? "../../index.html" : "index.html",
    pages: inPagesFolder ? "" : "src/pages/"
  };
}

function getSessionRole() {
  const session = JSON.parse(localStorage.getItem("eventora_session") || "null");
  if (!session?.isLoggedIn) return null;
  return session.user?.role || localStorage.getItem("userRole");
}

function renderRoleNav() {
  const mainNav = document.getElementById("mainNav");
  const mobileNav = document.getElementById("mobileNav");
  const headerAction = document.getElementById("headerAction");

  if (!mainNav) return;

  const role = getSessionRole();
  const path = getNavPaths();

  if (!role) {
    mainNav.innerHTML = `
      <a href="${path.home}">Events</a>
      <a href="${path.pages}login.html">Login</a>
    `;

    if (mobileNav) {
      mobileNav.innerHTML = `
        <a href="${path.home}">Events</a>
        <a href="${path.pages}login.html">Login</a>
      `;
    }

    if (headerAction) {
      headerAction.textContent = "Create account";
      headerAction.href = `${path.pages}register.html`;
    }

    return;
  }

  if (role === "attendee") {
    mainNav.innerHTML = `
      <a href="${path.home}">Events</a>
      <a href="${path.pages}tickets.html">My Tickets</a>
      <a href="${path.pages}notifications.html">Notifications</a>
      <a href="${path.pages}my-completed-events.html">Completed Events</a>
      <a href="${path.pages}profile.html">Profile</a>
      <a href="${path.pages}login.html?logout=1">Sign out</a>
    `;

    if (mobileNav) {
      mobileNav.innerHTML = `
        <a href="${path.home}">Events</a>
        <a href="${path.pages}tickets.html">Tickets</a>
        <a href="${path.pages}profile.html">Profile</a>
        <a href="${path.pages}login.html?logout=1">Sign out</a>
      `;
    }

    if (headerAction) {
      headerAction.textContent = "Browse Events";
      headerAction.href = path.home;
    }
  }

  if (role === "organiser") {
    mainNav.innerHTML = `
      <a href="${path.home}">Events</a>
      <a href="${path.pages}organiser-dashboard.html">Organiser Dashboard</a>
      <a href="${path.pages}notifications.html">Notifications</a>
      <a href="${path.pages}check-in.html">QR Check-in</a>
      <a href="${path.pages}organizer-feedback.html">Feedback Analytics</a>
      <a href="${path.pages}profile.html">Profile</a>
      <a href="${path.pages}login.html?logout=1">Sign out</a>
    `;

    if (mobileNav) {
      mobileNav.innerHTML = `
        <a href="${path.home}">Events</a>
        <a href="${path.pages}organiser-dashboard.html">Dashboard</a>
        <a href="${path.pages}check-in.html">Scan</a>
        <a href="${path.pages}profile.html">Profile</a>
      `;
    }

    if (headerAction) {
      headerAction.textContent = "Open Dashboard";
      headerAction.href = `${path.pages}organiser-dashboard.html`;
    }
  }

  if (role === "faculty_admin") {
    mainNav.innerHTML = `
      <a href="${path.home}">Events</a>
      <a href="${path.pages}approval-queue.html">Approval Queue</a>
      <a href="${path.pages}admin-dashboard.html">Admin Dashboard</a>
      <a href="${path.pages}notifications.html">Notifications</a>
      <a href="${path.pages}profile.html">Profile</a>
      <a href="${path.pages}login.html?logout=1">Sign out</a>
    `;

    if (mobileNav) {
      mobileNav.innerHTML = `
        <a href="${path.home}">Events</a>
        <a href="${path.pages}approval-queue.html">Approve</a>
        <a href="${path.pages}admin-dashboard.html">Admin</a>
        <a href="${path.pages}profile.html">Profile</a>
      `;
    }

    if (headerAction) {
      headerAction.textContent = "Review Queue";
      headerAction.href = `${path.pages}approval-queue.html`;
    }
  }
}

document.addEventListener("DOMContentLoaded", renderRoleNav);