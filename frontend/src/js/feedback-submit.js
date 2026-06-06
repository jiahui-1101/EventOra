const attendedEvents = [
    { id: 2, title: "Campus Cultural Night", date: "2026-06-20", alreadyRated: false },
    { id: 1, title: "Build Your First AI App", date: "2026-06-12", alreadyRated: true, rating: 5, comment: "Great workshop!" }
  ];

  let feedbacks = JSON.parse(localStorage.getItem("eventora_feedbacks")) || [];
  function saveFeedback(eventId, rating, comment) {
    const existing = feedbacks.find(f => f.eventId === eventId);
    if (existing) {
      existing.rating = rating; existing.comment = comment; existing.updated = new Date();
    } else {
      feedbacks.push({ eventId, rating, comment, createdAt: new Date() });
    }
    localStorage.setItem("eventora_feedbacks", JSON.stringify(feedbacks));
    alert("Thank you for your feedback!");
    renderForms();
  }
  function renderForms() {
    const container = document.getElementById("feedbackFormContainer");
    container.innerHTML = attendedEvents.map(ev => {
      const existing = feedbacks.find(f => f.eventId === ev.id);
      const ratingVal = existing ? existing.rating : (ev.alreadyRated ? ev.rating : 5);
      const commentVal = existing ? existing.comment : (ev.alreadyRated ? ev.comment : "");
      const disabled = ev.alreadyRated && !existing ? false : (existing ? true : false); 
      const submitDisabled = (existing && !ev.alreadyRated) ? "disabled" : "";
      return `
        <div style="border:1px solid var(--border); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem;">
          <h3>${ev.title}</h3>
          <p>Date: ${ev.date}</p>
          <div class="rating-stars">
            <label>Rating (1-5): </label>
            <select id="rating-${ev.id}" ${existing ? "disabled" : ""}>
              ${[1,2,3,4,5].map(r => `<option value="${r}" ${ratingVal==r ? 'selected' : ''}>${r} star${r>1?'s':''}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Comment:</label><br/>
            <textarea id="comment-${ev.id}" rows="3" style="width:100%;" ${existing ? "disabled" : ""}>${commentVal}</textarea>
          </div>
          ${!existing ? `<button class="button button-primary" data-id="${ev.id}" id="submit-${ev.id}">Submit Feedback</button>` : `<span class="badge badge-green">Feedback already submitted</span>`}
        </div>
      `;
    }).join("");
    attendedEvents.forEach(ev => {
      const btn = document.getElementById(`submit-${ev.id}`);
      if(btn) btn.addEventListener("click", () => {
        const rating = parseInt(document.getElementById(`rating-${ev.id}`).value);
        const comment = document.getElementById(`comment-${ev.id}`).value;
        saveFeedback(ev.id, rating, comment);
      });
    });
  }
  renderForms();