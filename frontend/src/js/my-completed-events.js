const currentUserId = 1;

const eventsData = [
  { id: 1, title: "Build Your First AI App", date: "2026-06-12", status: "completed", checkedIn: true, hasFeedback: false, hasCertificate: false },
  { id: 2, title: "Campus Cultural Night", date: "2026-06-20", status: "completed", checkedIn: true, hasFeedback: true, hasCertificate: true },
  { id: 3, title: "Interfaculty Futsal Cup", date: "2026-06-28", status: "completed", checkedIn: false, hasFeedback: false, hasCertificate: false },
  { id: 4, title: "Vue 3 Crash Course", date: "2026-05-18", status: "completed", checkedIn: true, hasFeedback: false, hasCertificate: false }
];

let feedbacks = JSON.parse(localStorage.getItem("eventora_feedbacks")) || [];

function renderCompletedEvents() {
  const completed = eventsData.filter(ev => ev.status === "completed");
  const container = document.getElementById("completedEventsList");
  if (completed.length === 0) {
    container.innerHTML = "<p>No completed events yet.</p>";
    return;
  }
  container.innerHTML = completed.map(ev => {
    const existingFeedback = feedbacks.find(f => f.eventId === ev.id);
    const hasFeedback = existingFeedback !== undefined;
    const canReview = ev.checkedIn && !hasFeedback;
    const certificateAvailable = ev.checkedIn && (hasFeedback || ev.hasCertificate);
    return `
      <article class="event-card">
        <div class="event-cover academic-cover">
          <span class="badge badge-blue">${ev.title}</span>
        </div>
        <div class="event-card-body">
          <span class="event-date">📅 ${new Date(ev.date).toLocaleDateString()}</span>
          <p>Status: Completed</p>
          <div style="display: flex; gap: 12px; margin-top: 12px;">
            ${canReview ? `<button class="button button-secondary review-btn" data-id="${ev.id}">⭐ Rate & Review</button>` : (hasFeedback ? `<span class="badge badge-green">Reviewed</span>` : `<span class="badge badge-gray">Not attended</span>`)}
            <button class="button certificate-btn ${!certificateAvailable ? 'disabled' : ''}" data-id="${ev.id}" ${!certificateAvailable ? 'disabled' : ''}>📜 Download Certificate</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".review-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const eventId = parseInt(btn.dataset.id);
      showFeedbackModal(eventId);
    });
  });

  document.querySelectorAll(".certificate-btn:not(.disabled)").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const eventId = parseInt(btn.dataset.id);
      downloadCertificate(eventId);
    });
  });
}

function showFeedbackModal(eventId) {
  const event = eventsData.find(e => e.id === eventId);
  const modalDiv = document.getElementById("feedbackModal");
  modalDiv.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>Rate & Review: ${event.title}</h3>
        <div class="star-rating" id="starRating">
          <span data-value="1">☆</span>
          <span data-value="2">☆</span>
          <span data-value="3">☆</span>
          <span data-value="4">☆</span>
          <span data-value="5">☆</span>
        </div>
        <textarea id="reviewComment" rows="4" placeholder="Share your experience..." style="width:100%; margin: 1rem 0;"></textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="button button-ghost" id="cancelModal">Cancel</button>
          <button class="button button-primary" id="submitFeedback">Submit</button>
        </div>
      </div>
    </div>
  `;
  modalDiv.style.display = "block";

  let selectedRating = 0;
  const stars = modalDiv.querySelectorAll("#starRating span");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.value);
      stars.forEach((s, idx) => {
        if (idx < selectedRating) s.innerHTML = "★";
        else s.innerHTML = "☆";
        s.classList.toggle("active", idx < selectedRating);
      });
    });
  });

  document.getElementById("cancelModal").addEventListener("click", () => {
    modalDiv.style.display = "none";
  });
  document.getElementById("submitFeedback").addEventListener("click", () => {
    const comment = document.getElementById("reviewComment").value.trim();
    if (selectedRating === 0) {
      alert("Please select a rating.");
      return;
    }
    
    const existing = feedbacks.find(f => f.eventId === eventId);
    if (existing) {
      existing.rating = selectedRating;
      existing.comment = comment;
      existing.updated = new Date();
    } else {
      feedbacks.push({ eventId, rating: selectedRating, comment: comment, createdAt: new Date() });
    }
    localStorage.setItem("eventora_feedbacks", JSON.stringify(feedbacks));
    const ev = eventsData.find(e => e.id === eventId);
    ev.hasFeedback = true;
    ev.hasCertificate = true;
    modalDiv.style.display = "none";
    renderCompletedEvents(); 
    alert("Thank you for your feedback! You can now download your certificate.");
  });
}

function downloadCertificate(eventId) {
  const event = eventsData.find(e => e.id === eventId);
  const win = window.open();
  win.document.write(`
    <html><head><title>Certificate - ${event.title}</title>
    <style>
      body { font-family: Georgia, serif; text-align: center; padding: 4rem; }
      .cert { border: 8px double #4f46e5; padding: 2rem; max-width: 600px; margin: 0 auto; }
    </style>
    </head>
    <body><div class="cert">
      <h1>Certificate of Participation</h1>
      <p>This certificate is awarded to</p>
      <h2>Current User</h2>
      <p>for attending</p>
      <h3>${event.title}</h3>
      <p>on ${new Date(event.date).toLocaleDateString()}</p>
      <p>EventOra - UTM Student Society Platform</p>
      <button onclick="window.print()">Save as PDF</button>
    </div></body></html>
  `);
  win.document.close();
}

document.addEventListener("DOMContentLoaded", renderCompletedEvents);