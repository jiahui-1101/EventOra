const eventsData = [
  { id: 1, title: "Build Your First AI App", society: "UTM Computing Society", category: "academic", price: 8, priceType: "paid", date: "2026-06-12T19:30:00", venue: "N28A Innovation Lab", capacity: 40, registered: 28, seatsLeft: 12, coverClass: "academic-cover", badgeClass: "badge-blue" },
  { id: 2, title: "Campus Cultural Night", society: "Campus Culture Club", category: "cultural", price: 0, priceType: "free", date: "2026-06-20T18:30:00", venue: "Dewan Sultan Iskandar", capacity: 200, registered: 146, seatsLeft: 54, coverClass: "culture-cover", badgeClass: "badge-purple" },
  { id: 3, title: "Interfaculty Futsal Cup", society: "UTM Sports Club", category: "sports", price: 0, priceType: "free", date: "2026-06-28T09:00:00", venue: "UTM Sports Hall", capacity: 40, registered: 40, seatsLeft: 0, coverClass: "sports-cover", badgeClass: "badge-green" },
  { id: 4, title: "Ramadan Iftar Gathering", society: "Muslim Students Association", category: "religious", price: 0, priceType: "free", date: "2026-06-15T18:00:00", venue: "Dewan Sri Budaya", capacity: 100, registered: 87, seatsLeft: 13, coverClass: "academic-cover", badgeClass: "badge-blue" },
  { id: 5, title: "Hackathon 2026", society: "UTM Computing Society", category: "academic", price: 15, priceType: "paid", date: "2026-07-05T09:00:00", venue: "FAB Lab", capacity: 60, registered: 42, seatsLeft: 18, coverClass: "academic-cover", badgeClass: "badge-blue" },
  { id: 6, title: "Traditional Dance Workshop", society: "Cultural Club", category: "cultural", price: 5, priceType: "paid", date: "2026-06-25T15:00:00", venue: "DK 1", capacity: 30, registered: 22, seatsLeft: 8, coverClass: "culture-cover", badgeClass: "badge-purple" },
];

let favorites = JSON.parse(localStorage.getItem("eventora_favorites")) || [];

function isFavorited(id) {
  return favorites.includes(id);
}

function toggleFavorite(id) {
  if (isFavorited(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("eventora_favorites", JSON.stringify(favorites));
  renderEvents();
}

let currentFilters = { category: "all", price: "all", date: "all", keyword: "" };

function isInDateRange(eventDate, filter) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const eventDay = new Date(eventDate);
  if (filter === "week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return eventDay >= today && eventDay <= nextWeek;
  } else if (filter === "month") {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    return eventDay >= today && eventDay <= nextMonth;
  }
  return true;
}

function renderEvents() {
  let filtered = eventsData.filter(ev => {
    if (currentFilters.category !== "all" && ev.category !== currentFilters.category) return false;
    if (currentFilters.price === "free" && ev.priceType !== "free") return false;
    if (currentFilters.price === "paid" && ev.priceType !== "paid") return false;
    if (currentFilters.date !== "all" && !isInDateRange(ev.date, currentFilters.date)) return false;
    if (currentFilters.keyword && !ev.title.toLowerCase().includes(currentFilters.keyword.toLowerCase()) && !ev.society.toLowerCase().includes(currentFilters.keyword.toLowerCase())) return false;
    return true;
  });

  document.getElementById("upcomingStat").innerText = filtered.length;
  document.getElementById("freeStat").innerText = filtered.filter(ev => ev.priceType === "free").length;
  document.getElementById("thisWeekStat").innerText = filtered.filter(ev => isInDateRange(ev.date, "week")).length;
  document.getElementById("eventCount").innerHTML = `${filtered.length} events live`;

  const grid = document.getElementById("eventGrid");
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem;">No events match your filters. Try adjusting search or filters.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(ev => {
    const favClass = isFavorited(ev.id) ? "❤️" : "🤍";
    const seatsHtml = ev.seatsLeft === 0 ? `<span class="badge badge-yellow">Full</span>` : `<span class="badge badge-gray">${ev.seatsLeft} seats left</span>`;
    const priceDisplay = ev.priceType === "free" ? "Free" : `RM ${ev.price}`;
    const buttonText = ev.priceType === "free" ? "Free event" : `Register RM ${ev.price}`;
    const buttonClass = ev.priceType === "free" ? "button-secondary" : "button-primary";
    const cardClass = ev.seatsLeft === 0 ? "event-card full" : "event-card";
    const formattedDate = new Date(ev.date).toLocaleString('en-MY', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    
    const percent = ((ev.registered / ev.capacity) * 100).toFixed(0);
    
    return `
      <article class="${cardClass}" data-event-id="${ev.id}">
        <div class="event-cover ${ev.coverClass}">
          <span class="badge ${ev.badgeClass}">${ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}</span>
          ${seatsHtml}
          <button class="favorite-btn" data-id="${ev.id}" style="background:transparent; border:none; font-size:1.3rem; cursor:pointer; margin-left:auto;">${favClass}</button>
        </div>
        <div class="event-card-body">
          <span class="event-date">📅 ${formattedDate}</span>
          <h3>${ev.title}</h3>
          <p>${ev.venue} · ${ev.society} · Faculty approved</p>
          <div class="seats-progress">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="card-meta">
            <span>${ev.priceType === "paid" ? "Paid ticket" : "Open registration"}</span>
            <strong>${priceDisplay}</strong>
          </div>
          <a class="button ${buttonClass}" href="src/pages/event-detail.html?event=${ev.id}">${buttonText}</a>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".favorite-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id);
      toggleFavorite(id);
    });
  });
}

function bindFilters() {
  const categorySelect = document.getElementById("categorySelect");
  const priceSelect = document.getElementById("priceSelect");
  const dateSelect = document.getElementById("dateSelect");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      currentFilters.category = e.target.value;
      renderEvents();
    });
  }
  if (priceSelect) {
    priceSelect.addEventListener("change", (e) => {
      currentFilters.price = e.target.value;
      renderEvents();
    });
  }
  if (dateSelect) {
    dateSelect.addEventListener("change", (e) => {
      currentFilters.date = e.target.value;
      renderEvents();
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      currentFilters.keyword = searchInput.value.trim();
      renderEvents();
    });
  }
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        currentFilters.keyword = e.target.value.trim();
        renderEvents();
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (categorySelect) categorySelect.value = "all";
      if (priceSelect) priceSelect.value = "all";
      if (dateSelect) dateSelect.value = "all";
      if (searchInput) searchInput.value = "";
      currentFilters = { category: "all", price: "all", date: "all", keyword: "" };
      renderEvents();
    });
  }
}

function applyRoleBasedNav() {
  const session = JSON.parse(localStorage.getItem("eventora_session") || "null");
  const role = session?.user?.role;

  const mainNav = document.getElementById("mainNav");
  const mobileNav = document.getElementById("mobileNav");
  const headerAction = document.getElementById("headerAction");

  if (!mainNav || !mobileNav || !headerAction) return;

  if (!session?.isLoggedIn || !role) {
    mainNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/login.html">Login</a>
    `;

    mobileNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/login.html">Login</a>
    `;

    headerAction.textContent = "Create account";
    headerAction.href = "src/pages/register.html";
    return;
  }

  if (role === "attendee") {
    mainNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/tickets.html">My Tickets</a>
      <a href="src/pages/my-completed-events.html">Completed Events</a>
      <a href="src/pages/profile.html">Profile</a>
      <a href="src/pages/login.html">Sign out</a>
    `;

    mobileNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/tickets.html">Tickets</a>
      <a href="src/pages/profile.html">Profile</a>
      <a href="src/pages/login.html">Sign out</a>
    `;

    headerAction.textContent = "Browse Events";
    headerAction.href = "#events";
  }

  if (role === "organiser") {
    mainNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/organiser-dashboard.html">Organiser Dashboard</a>
      <a href="src/pages/check-in.html">QR Check-in</a>
      <a href="src/pages/organizer-feedback.html">Feedback Analytics</a>
      <a href="src/pages/profile.html">Profile</a>
      <a href="src/pages/login.html">Sign out</a>
    `;

    mobileNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/organiser-dashboard.html">Dashboard</a>
      <a href="src/pages/check-in.html">Scan</a>
      <a href="src/pages/profile.html">Profile</a>
    `;

    headerAction.textContent = "Open Dashboard";
    headerAction.href = "src/pages/organiser-dashboard.html";
  }

  if (role === "faculty_admin") {
    mainNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/approval-queue.html">Approval Queue</a>
      <a href="src/pages/admin-dashboard.html">Admin Dashboard</a>
      <a href="src/pages/profile.html">Profile</a>
      <a href="src/pages/login.html">Sign out</a>
    `;

    mobileNav.innerHTML = `
      <a href="index.html">Events</a>
      <a href="src/pages/approval-queue.html">Approve</a>
      <a href="src/pages/admin-dashboard.html">Admin</a>
      <a href="src/pages/profile.html">Profile</a>
    `;

    headerAction.textContent = "Review Pending Events";
    headerAction.href = "src/pages/approval-queue.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderEvents();
  bindFilters();
  applyRoleBasedNav();
});