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
    document.querySelectorAll("#categoryFilters .filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#categoryFilters .filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentFilters.category = chip.dataset.cat;
        renderEvents();
      });
    });
    document.querySelectorAll("#priceFilters .filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#priceFilters .filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentFilters.price = chip.dataset.price;
        renderEvents();
      });
    });
    document.querySelectorAll("#dateFilters .filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#dateFilters .filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentFilters.date = chip.dataset.date;
        renderEvents();
      });
    });
    document.getElementById("searchBtn").addEventListener("click", () => {
      currentFilters.keyword = document.getElementById("searchInput").value.trim();
      renderEvents();
    });
    document.getElementById("searchInput").addEventListener("keyup", (e) => {
      if(e.key === "Enter") {
        currentFilters.keyword = e.target.value.trim();
        renderEvents();
      }
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    renderEvents();
    bindFilters();
  });