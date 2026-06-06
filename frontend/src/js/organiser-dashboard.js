const societyEvents = [
    { id: 1, title: "Build Your First AI App", status: "published", registrations: 28, checkedIn: 18, avgRating: 4.5 },
    { id: 2, title: "Hackathon 2026", status: "pending_approval", registrations: 0, checkedIn: 0, avgRating: null },
    { id: 3, title: "Futsal Tournament", status: "published", registrations: 40, checkedIn: 32, avgRating: 4.2 }
  ];
  const registrationsList = [
    { name: "Aina Rahman", email: "aina@utm.my", status: "confirmed", ticketCode: "EVT-9F4K-2Q8M-X7P1" },
    { name: "Nurul Iman", email: "nurul@utm.my", status: "confirmed", ticketCode: "EVT-3H7J-1L9N-P5R2" },
    { name: "Kevin Tan", email: "kevin@utm.my", status: "waitlist", ticketCode: null }
  ];
  const feedbackData = [
    { rating: 5, comment: "Excellent workshop!" },
    { rating: 4, comment: "Good but short" },
    { rating: 5, comment: "Very inspiring" }
  ];

  function renderEventsTab() {
    return `<div class="page-section"><div class="section-heading"><h2>Manage Events</h2><button class="button button-primary" id="createEventBtn">+ Create Event</button></div>
    <table style="width:100%; border-collapse:collapse; margin-top:1rem;">
      <thead><tr style="border-bottom:1px solid var(--border);"><th>Title</th><th>Status</th><th>Registrations</th><th>Checked In</th><th>Avg Rating</th><th>Actions</th></tr></thead>
      <tbody>${societyEvents.map(ev => `<tr style="border-bottom:1px solid var(--border);"><td>${ev.title}</td><td><span class="badge ${ev.status === 'published' ? 'badge-green' : 'badge-yellow'}">${ev.status}</span></td><td>${ev.registrations}</td><td>${ev.checkedIn}</td><td>${ev.avgRating || '—'}</td><td><button class="button button-secondary" data-id="${ev.id}">Edit</button> <button class="button button-danger" data-id="${ev.id}">Cancel</button></td></tr>`).join('')}
      </tbody>
    </table></div>`;
  }

  function renderRegistrationsTab() {
    return `<div class="page-section"><h2>Registrations (Build Your First AI App)</h2>
    <table style="width:100%; border-collapse:collapse;"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Ticket Code</th></tr></thead>
    <tbody>${registrationsList.map(r => `<tr><td>${r.name}</td><td>${r.email}</td><td><span class="badge ${r.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}">${r.status}</span></td><td><code>${r.ticketCode || '—'}</code></td></tr>`).join('')}</tbody></table>
    <button class="button button-primary" id="exportRegistrationsCSV" style="margin-top:1rem;">📥 Export CSV</button></div>`;
  }

  function renderAttendanceTab() {
    return `<div class="page-section"><h2>Check-in Overview</h2><div class="capacity-bar" style="margin-bottom:1rem;"><span style="width:64%"></span></div><p>18 / 28 checked in</p>
    <table><thead><tr><th>Attendee</th><th>Checked In At</th><th>Verified By</th></tr></thead>
    <tbody><tr><td>Aina Rahman</td><td>7:18 PM, 12 Jun</td><td>Nurul Admin</td></tr><tr><td>Nurul Iman</td><td>7:22 PM, 12 Jun</td><td>Nurul Admin</td></tr></tbody></table>
    <button class="button button-primary" id="exportAttendanceCSV">📊 Export Attendance CSV</button></div>`;
  }

  function renderFeedbackTab() {
    const avg = (feedbackData.reduce((s,f)=>s+f.rating,0)/feedbackData.length).toFixed(1);
    return `<div class="page-section"><h2>Feedback & Ratings</h2><div><strong>Average Rating: ${avg} / 5</strong> (${feedbackData.length} reviews)</div>
    <ul>${feedbackData.map(f => `<li>${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)} - ${f.comment}</li>`).join('')}</ul>
    <button class="button button-primary" id="exportFeedbackCSV">📝 Export Feedback CSV</button></div>`;
  }

  function exportCSV(rows, filename) {
    let csv = rows.map(row => Object.values(row).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  document.getElementById("dashboardContent").innerHTML = renderEventsTab();
  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".sidebar-nav a").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const tab = link.dataset.tab;
      if (tab === "events") document.getElementById("dashboardContent").innerHTML = renderEventsTab();
      if (tab === "registrations") document.getElementById("dashboardContent").innerHTML = renderRegistrationsTab();
      if (tab === "attendance") document.getElementById("dashboardContent").innerHTML = renderAttendanceTab();
      if (tab === "feedback") document.getElementById("dashboardContent").innerHTML = renderFeedbackTab();
      if (tab === "registrations") document.getElementById("exportRegistrationsCSV")?.addEventListener("click", () => exportCSV(registrationsList.map(r => ({Name:r.name, Email:r.email, Status:r.status, Ticket:r.ticketCode})), "registrations.csv"));
      if (tab === "attendance") document.getElementById("exportAttendanceCSV")?.addEventListener("click", () => exportCSV([{Attendee:"Aina Rahman", Time:"7:18 PM"},{Attendee:"Nurul Iman", Time:"7:22 PM"}], "attendance.csv"));
      if (tab === "feedback") document.getElementById("exportFeedbackCSV")?.addEventListener("click", () => exportCSV(feedbackData, "feedback.csv"));
    });
  });