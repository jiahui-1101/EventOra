const societies = [
  { name: "UTM Computing Society", events: 8, registered: 214, attended: 176 },
  { name: "Campus Culture Club", events: 5, registered: 312, attended: 258 },
  { name: "UTM Sports Society", events: 11, registered: 428, attended: 341 },
  { name: "Engineering Society", events: 4, registered: 98, attended: 79 },
  { name: "Photography Club", events: 3, registered: 152, attended: 133 }
];

const popularEvents = [
  { rank: 1, title: "Campus Cultural Night", society: "Campus Culture Club", date: "20 Jun 2026", category: "Cultural", badgeClass: "badge-purple", registered: 312 },
  { rank: 2, title: "UTM Sports Day", society: "UTM Sports Society", date: "5 Jul 2026", category: "Sports", badgeClass: "badge-green", registered: 284 },
  { rank: 3, title: "Build Your First AI App", society: "UTM Computing Society", date: "12 Jun 2026", category: "Academic", badgeClass: "badge-blue", registered: 198 }
];

// Render society table
document.getElementById('societyTableBody').innerHTML = societies.map((s, i) => {
  const rate = Math.round((s.attended / s.registered) * 100);
  return `<tr>
    <td>${s.name}</td>
    <td>${s.events}</td>
    <td>${s.registered}</td>
    <td>${s.attended}</td>
    <td>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:6px;border-radius:999px;background:var(--border);overflow:hidden;">
          <div style="width:${rate}%;height:100%;background:var(--primary);border-radius:999px;"></div>
        </div>
        <strong>${rate}%</strong>
      </div>
    </td>
  </tr>`;
}).join('');

// Render popular events
document.getElementById('popularEventsList').innerHTML = popularEvents.map(ev => `
  <article class="popular-event-card">
    <div class="popular-rank">${ev.rank}</div>
    <div class="popular-info">
      <strong>${ev.title}</strong>
      <span>${ev.society} · ${ev.date}</span>
    </div>
    <div class="popular-meta">
      <span class="badge ${ev.badgeClass}">${ev.category}</span>
      <strong>${ev.registered} registered</strong>
    </div>
  </article>
`).join('');