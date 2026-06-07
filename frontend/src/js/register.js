function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.querySelectorAll('input[name="role"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.querySelectorAll(".role-option").forEach(opt => opt.classList.remove("role-active"));
    radio.closest(".role-option").classList.add("role-active");
  });
});

document.getElementById("registerBtn").addEventListener("click", () => {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  const role = document.querySelector('input[name="role"]:checked')?.value || "attendee";
  const errorDiv = document.getElementById("registerError");
  const successDiv = document.getElementById("registerSuccess");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!firstName || !lastName || !email || !password || !confirm) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Please fill in all fields.";
    return;
  }

  if (!isValidEmail(email)) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Please enter a valid email address.";
    return;
  }

  if (password.length < 8) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Password must be at least 8 characters.";
    return;
  }

  if (password !== confirm) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Passwords do not match.";
    return;
  }

  localStorage.setItem("eventora_registered_user", JSON.stringify({
    firstName,
    lastName,
    email,
    matric: "",
    role,
    society: role === "organiser" ? "Pending society assignment" : "General Attendee"
  }));

  successDiv.style.display = "block";
  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
});