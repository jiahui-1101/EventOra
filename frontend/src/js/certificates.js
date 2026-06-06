const attendedEvents = [
  { id:1, title:"Build Your First AI App", date:"2026-06-12", user:"Aina Rahman" },
  { id:2, title:"Campus Cultural Night", date:"2026-06-20", user:"Aina Rahman" }
];
function generateCertificate(event) {
  const win = window.open();
  win.document.write(`
    <html><head><title>Certificate - ${event.title}</title><style>body{font-family:Georgia;text-align:center;padding:3rem;} .cert{border:8px double #4f46e5;padding:2rem;}</style></head>
    <body><div class="cert"><h1>Certificate of Participation</h1><p>This certificate is awarded to</p><h2>${event.user}</h2><p>for attending</p><h3>${event.title}</h3><p>held on ${event.date}</p><p>EventOra - UTM Student Society Platform</p><button onclick="window.print()">Save as PDF</button></div></body></html>
  `);
}
const container = document.getElementById("certList");
container.innerHTML = attendedEvents.map(ev => `
  <div class="certificate-card">
    <h3>${ev.title}</h3>
    <p>Date: ${ev.date}</p>
    <button class="button button-primary" data-id="${ev.id}">Download Certificate (PDF)</button>
  </div>
`).join('');
document.querySelectorAll("[data-id]").forEach(btn => {
  const id = parseInt(btn.dataset.id);
  const ev = attendedEvents.find(e => e.id === id);
  btn.addEventListener("click", () => generateCertificate(ev));
});