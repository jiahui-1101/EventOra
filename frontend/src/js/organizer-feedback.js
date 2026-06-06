const allFeedbacks = {
    1: [{ rating: 5, comment: "Excellent!" }, { rating: 4, comment: "Good but short" }],
    2: [{ rating: 5, comment: "Cultural night was amazing" }, { rating: 5, comment: "Loved it" }, { rating: 4, comment: "Food could be better" }],
    3: [{ rating: 3, comment: "Futsal field too hot" }],
  };
  const events = [
    { id:1, title:"Build Your First AI App" },
    { id:2, title:"Campus Cultural Night" },
    { id:3, title:"Interfaculty Futsal Cup" },
  ];
  function renderFeedback(eventId) {
    const feedbacks = allFeedbacks[eventId] || [];
    const avg = feedbacks.length ? (feedbacks.reduce((sum,f)=>sum+f.rating,0)/feedbacks.length).toFixed(1) : "No ratings";
    const html = `<div><strong>Average Rating: ${avg} / 5</strong> (${feedbacks.length} reviews)</div>
      <ul style="margin-top:1rem;">${feedbacks.map(f => `<li><strong>${f.rating}★</strong> - ${f.comment}</li>`).join('')}</ul>`;
    document.getElementById("feedbackStats").innerHTML = html;
    window.currentEventId = eventId;
  }
  function exportCSV() {
    const eventId = window.currentEventId;
    const feedbacks = allFeedbacks[eventId] || [];
    let csv = "Rating,Comment\n" + feedbacks.map(f => `${f.rating},"${f.comment.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([csv], {type: "text/csv"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `feedback_event_${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function populateEventSelect() {
    const select = document.getElementById("eventSelect");
    select.innerHTML = events.map(ev => `<option value="${ev.id}">${ev.title}</option>`).join('');
    select.addEventListener("change", (e) => renderFeedback(parseInt(e.target.value)));
    renderFeedback(events[0].id);
  }
  populateEventSelect();
  document.getElementById("exportCSVBtn").addEventListener("click", exportCSV);