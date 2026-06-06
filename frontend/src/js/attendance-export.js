const events = [
    { id:1, title:"Build Your First AI App", checkedIn: ["Aina Rahman", "Nurul Iman", "Kevin Tan"] },
    { id:2, title:"Campus Cultural Night", checkedIn: ["Aina Rahman", "Siti Aisyah", "Muthu", "Lee Wei"] }
  ];
  function exportAttendance(eventId) {
    const ev = events.find(e => e.id === eventId);
    let csv = "Name,Check-in Time\n" + ev.checkedIn.map(name => `${name},${new Date().toLocaleString()}`).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${ev.title.replace(/\s/g,'_')}.csv`;
    a.click();
  }
  const select = document.getElementById("eventSelect");
  select.innerHTML = events.map(ev => `<option value="${ev.id}">${ev.title}</option>`).join('');
  document.getElementById("exportBtn").addEventListener("click", () => exportAttendance(parseInt(select.value)));