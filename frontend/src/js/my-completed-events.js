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
    const userName = "Current User"; 
    const dateStr = new Date(event.date).toLocaleDateString('en-MY', { year:'numeric', month:'long', day:'numeric' });
    
    const win = window.open();
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${event.title}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #eef2f7;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: 'Georgia', 'Times New Roman', serif;
            padding: 20px;
          }
          .certificate {
            position: relative;
            max-width: 800px;
            width: 100%;
            background: #fffef7;
            border: 12px double #4f46e5;
            border-radius: 16px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: 0 20px 35px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .certificate::before {
            content: "UTM • EventOra";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-25deg);
            font-size: 70px;
            font-weight: bold;
            color: rgba(79, 70, 229, 0.08);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }
          .certificate h1 {
            font-size: 2.5rem;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            display: inline-block;
            padding-bottom: 8px;
            margin-bottom: 20px;
          }
          .certificate .awardee {
            font-size: 1.8rem;
            color: #4f46e5;
            margin: 25px 0 10px;
            font-weight: bold;
          }
          .certificate .event-title {
            font-size: 1.6rem;
            color: #111827;
            margin: 15px 0;
          }
          .certificate .date {
            color: #6b7280;
            margin-top: 25px;
            font-style: italic;
          }
          .certificate footer {
            margin-top: 35px;
            font-size: 0.8rem;
            color: #9ca3af;
            border-top: 1px dashed #e5e7eb;
            padding-top: 20px;
          }
          .download-btn {
            display: inline-block;
            margin-top: 30px;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 1rem;
            border-radius: 40px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            transition: background 0.2s;
          }
          .download-btn:hover {
            background: #3730a3;
          }
          @media (max-width: 640px) {
            .certificate { padding: 25px 20px; }
            .certificate h1 { font-size: 1.8rem; }
            .awardee { font-size: 1.4rem; }
            .event-title { font-size: 1.2rem; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Certificate of Participation</h1>
          <div class="awardee">${escapeHtml(userName)}</div>
          <p>has successfully participated in</p>
          <div class="event-title">${escapeHtml(event.title)}</div>
          <p>held on ${dateStr}</p>
          <div class="date">EventOra • UTM Student Society Platform</div>
          <footer>This certificate is auto-generated and verifiable via EventOra platform.</footer>
          <button class="download-btn" onclick="window.print(); setTimeout(() => { window.close(); }, 500);">📥 Save as PDF</button>
        </div>
        <script>
          const btn = document.querySelector('.download-btn');
          btn.addEventListener('click', () => {
            const toast = document.createElement('div');
            toast.innerText = '✅ Opening print dialog — save as PDF';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = '#10b981';
            toast.style.color = 'white';
            toast.style.padding = '8px 16px';
            toast.style.borderRadius = '40px';
            toast.style.fontSize = '14px';
            toast.style.zIndex = '9999';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
          });
        </script>
      </body>
      </html>
    `);
    win.document.close();
  }
  
  function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
document.addEventListener("DOMContentLoaded", renderCompletedEvents);