const allFeedbacks = {
  1: [{ rating: 5, comment: "Excellent workshop! Very practical." }, { rating: 4, comment: "Good but too short." }, { rating: 5, comment: "Loved it!" }],
  2: [{ rating: 5, comment: "Cultural night was amazing" }, { rating: 5, comment: "Loved the dances" }, { rating: 4, comment: "Food could be better" }, { rating: 3, comment: "Sound system issues" }],
  3: [{ rating: 3, comment: "Futsal field too hot" }, { rating: 2, comment: "Poor organization" }],
};

const attendanceData = {
  1: ["Aina Rahman", "Nurul Iman", "Kevin Tan", "Siti Aisyah"],
  2: ["Aina Rahman", "Muthu", "Lee Wei", "Siti Aisyah", "Nurul Iman"],
  3: ["Kevin Tan", "Aina Rahman"],
};

const events = [
  { id: 1, title: "Build Your First AI App" },
  { id: 2, title: "Campus Cultural Night" },
  { id: 3, title: "Interfaculty Futsal Cup" },
];

let currentEventId = 1;

function renderFeedback(eventId) {
  const feedbacks = allFeedbacks[eventId] || [];
  const total = feedbacks.length;
  
  let avg = 0;
  if (total > 0) {
    avg = (feedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1);
  }
  
  const distribution = [0, 0, 0, 0, 0]; 
  feedbacks.forEach(f => distribution[f.rating - 1]++);
  
  let barsHtml = "";
  for (let i = 5; i >= 1; i--) {
    const percent = total > 0 ? (distribution[i-1] / total) * 100 : 0;
    barsHtml += `
      <div class="rating-bar">
        <span class="rating-bar-label">${i} star${i > 1 ? 's' : ''}</span>
        <div class="rating-bar-bg">
          <div class="rating-bar-fill" style="width: ${percent}%;"></div>
        </div>
        <span class="rating-bar-percent">${percent.toFixed(0)}%</span>
      </div>
    `;
  }
  
  let commentsHtml = `<div class="comments-list"><h3>User Comments (${total})</h3>`;
  if (total === 0) {
    commentsHtml += `<p class="muted">No comments yet.</p>`;
  } else {
    feedbacks.forEach(f => {
      commentsHtml += `
        <div class="comment-item">
          <div class="comment-rating">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</div>
          <p class="comment-text">${escapeHtml(f.comment)}</p>
        </div>
      `;
    });
  }
  commentsHtml += `</div>`;
  
  const statsHtml = `
    <div class="feedback-summary">
      <div class="average-rating">
        <span class="avg-score">${avg}</span>
        <span class="avg-label">/ 5 average rating</span>
      </div>
      <div class="rating-distribution">
        <h4>Rating Distribution</h4>
        ${barsHtml}
      </div>
    </div>
    ${commentsHtml}
  `;
  
  document.getElementById("feedbackStats").innerHTML = statsHtml;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function exportFeedbackCSV(eventId) {
  const feedbacks = allFeedbacks[eventId] || [];
  let csvRows = [["Rating", "Comment"]];
  feedbacks.forEach(f => {
    csvRows.push([f.rating, `"${f.comment.replace(/"/g, '""')}"`]);
  });
  const csvContent = csvRows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  const event = events.find(e => e.id === eventId);
  link.download = `feedback_${event.title.replace(/\s/g, "_")}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportAttendanceCSV(eventId) {
  const attendees = attendanceData[eventId] || [];
  let csvRows = [["Attendee Name", "Check-in Time"]];
  attendees.forEach(name => {
    const mockTime = new Date().toLocaleString();
    csvRows.push([name, mockTime]);
  });
  const csvContent = csvRows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  const event = events.find(e => e.id === eventId);
  link.download = `attendance_${event.title.replace(/\s/g, "_")}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function populateEventSelect() {
  const select = document.getElementById("eventSelect");
  select.innerHTML = events.map(ev => `<option value="${ev.id}">${ev.title}</option>`).join('');
  select.addEventListener("change", (e) => {
    currentEventId = parseInt(e.target.value);
    renderFeedback(currentEventId);
  });
  currentEventId = events[0].id;
  renderFeedback(currentEventId);
}

document.addEventListener("DOMContentLoaded", () => {
  populateEventSelect();
  document.getElementById("exportFeedbackCsvBtn").addEventListener("click", () => {
    exportFeedbackCSV(currentEventId);
  });
  document.getElementById("exportAttendanceCsvBtn").addEventListener("click", () => {
    exportAttendanceCSV(currentEventId);
  });
});