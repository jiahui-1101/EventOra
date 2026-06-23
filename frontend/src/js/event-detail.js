const eventsData = [
    { id:1, title:"Build Your First AI App", society:"UTM Computing Society", category:"academic", price:8, priceType:"paid", date:"2026-06-12T19:30:00", venue:"N28A Innovation Lab", capacity:40, registered:28, seatsLeft:12, description:"A practical evening workshop for students who want to build and present a small AI-powered application before semester break.", organizerEmail:"society@utm.my", closeReg:"2026-06-10T23:59:00" },
    { id:2, title:"Campus Cultural Night", society:"Campus Culture Club", category:"cultural", price:0, priceType:"free", date:"2026-06-20T18:30:00", venue:"Dewan Sultan Iskandar", capacity:200, registered:146, seatsLeft:54, description:"Experience dances, music, and food from various cultures.", closeReg:"2026-06-18T23:59:00" },
  ];
  const params = new URLSearchParams(window.location.search);
  const eventId = parseInt(params.get("event")) || 1;
  const event = eventsData.find(e => e.id === eventId) || eventsData[0];

  const percent = ((event.registered / event.capacity) * 100).toFixed(0);
  const seatsLeftHtml = event.seatsLeft === 0 ? '<span class="badge badge-yellow">Full</span>' : `<span class="badge badge-gray">${event.seatsLeft} seats left</span>`;

  function downloadICS() {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2*60*60*1000);
    const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventOra//EN
BEGIN:VEVENT
UID:${event.id}@eventora.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.venue}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], {type: 'text/calendar'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function addToGoogleCalendar() {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2*60*60*1000);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start.toISOString().replace(/-|:|\.\d+/g, '')}/${end.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.venue)}`;
    window.open(url, '_blank');
  }

  let favorites = JSON.parse(localStorage.getItem("eventora_favorites")) || [];
  function isFavorited() { return favorites.includes(event.id); }
  function toggleFavorite() {
    if (isFavorited()) favorites = favorites.filter(id => id !== event.id);
    else favorites.push(event.id);
    localStorage.setItem("eventora_favorites", JSON.stringify(favorites));
    document.getElementById("favBtn").innerHTML = isFavorited() ? "❤️ Remove from favorites" : "🤍 Add to favorites";
  }

  function registerForEvent() {
    if (event.seatsLeft === 0) {
      window.location.href = "waitlist.html";
      return;
    }
    if (event.priceType === "free") {
      window.location.href = "tickets.html?status=free-confirmed";
    } else {
      window.location.href = `checkout.html?event=${event.id}`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("event-detail-page");
    container.innerHTML = `
      <section class="detail-layout page-section">
        <article class="event-detail-copy">
          <div class="event-banner">
            <span class="badge badge-blue">${event.society}</span>
            <h2>${event.title}</h2>
            <p>${event.description}</p>
          </div>
          <dl class="detail-list">
            <div><dt>Date and time</dt><dd>${new Date(event.date).toLocaleString()}</dd></div>
            <div><dt>Venue</dt><dd>${event.venue}</dd></div>
            <div><dt>Organiser</dt><dd>${event.society}</dd></div>
            <div><dt>Registration closes</dt><dd>${new Date(event.closeReg).toLocaleString()}</dd></div>
          </dl>
          <div style="margin-top: 20px; display: flex; gap: 12px;">
            <button class="button button-secondary" id="downloadICS">📅 Download .ics</button>
            <button class="button button-secondary" id="googleCalBtn">➕ Google Calendar</button>
            <button class="button button-ghost" id="favBtn">${isFavorited() ? "❤️ Remove" : "🤍 Add"}</button>
          </div>
        </article>
        <aside class="registration-panel">
          <div class="registration-header">
            <div><span class="badge badge-blue">${event.priceType === "paid" ? "Paid ticket" : "Free"}</span><h3>Reserve your seat</h3></div>
            <strong>${event.priceType === "paid" ? `RM ${event.price}` : "Free"}</strong>
          </div>
          <div class="capacity-labels"><span>${event.registered} registered</span><strong>${event.seatsLeft} seats left</strong></div>
          <div class="capacity-bar"><span style="width: ${percent}%"></span></div>
          <div class="checkout-list">
            <div><span>Capacity</span><strong>${event.capacity} attendees</strong></div>
            <div><span>Ticket type</span><strong>Student</strong></div>
            <div><span>Registration rule</span><strong>One active booking per user</strong></div>
            <div><span>QR ticket generation</span><strong>${event.priceType === "paid" ? "After successful payment only" : "Generated immediately after confirmation"}</strong></div>
          </div>
          <button class="button button-primary full-width" id="registerBtn">${event.priceType === "paid" ? "Proceed to Mock Payment" : "Get Free Ticket"}</button>
          <div class="registration-alert"><strong>Duplicate registration protected</strong><p>You can only register once per event.</p></div>
        </aside>
      </section>
    `;
    document.getElementById("downloadICS").addEventListener("click", downloadICS);
    document.getElementById("googleCalBtn").addEventListener("click", addToGoogleCalendar);
    document.getElementById("favBtn").addEventListener("click", toggleFavorite);
    document.getElementById("registerBtn").addEventListener("click", registerForEvent);
  });
