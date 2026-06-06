let pendingEvents = [
    { id: 101, society: "Robotics Club", title: "Line Follower Workshop", date: "2026-07-10", category: "Academic", capacity: 30 },
    { id: 102, society: "Entrepreneurship Society", title: "Startup Pitch Night", date: "2026-07-15", category: "Academic", capacity: 50 },
    { id: 103, society: "Music Club", title: "Acoustic Night", date: "2026-07-18", category: "Cultural", capacity: 80 }
  ];

  function renderQueue() {
    const tbody = document.getElementById("pendingEventsList");
    tbody.innerHTML = pendingEvents.map(ev => `
      <tr style="border-bottom:1px solid var(--border);">
        <td>${ev.society}</td><td>${ev.title}</td><td>${ev.date}</td><td>${ev.category}</td><td>${ev.capacity}</td>
        <td><button class="button button-success" data-id="${ev.id}">Approve</button> <button class="button button-danger" data-id="${ev.id}">Reject</button></td>
      </tr>
    `).join('');
    document.querySelectorAll(".button-success").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(btn.dataset.id);
        pendingEvents = pendingEvents.filter(ev => ev.id !== id);
        renderQueue();
        alert("Event approved (simulated).");
      });
    });
    document.querySelectorAll(".button-danger").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(btn.dataset.id);
        const reason = prompt("Please provide rejection reason:");
        if(reason) {
          pendingEvents = pendingEvents.filter(ev => ev.id !== id);
          renderQueue();
          alert(`Event rejected. Reason: ${reason}`);
        }
      });
    });
  }
  renderQueue();