const params = new URLSearchParams(window.location.search);

if (params.get("logout") === "1") {
  localStorage.removeItem("eventora_session");
  localStorage.removeItem("userRole");
}
const roleChips = document.querySelectorAll(".auth-role-chip");
let selectedRole = "attendee";

const demoProfiles = {
  attendee: {
    firstName: "Student",
    lastName: "User",
    email: "student@utm.my",
    matric: "A24CS0001",
    role: "attendee",
    society: "General Attendee"
  },
  organiser: {
    firstName: "Mei",
    lastName: "Shuet",
    email: "mei@utm.my",
    matric: "A24CS0102",
    role: "organiser",
    society: "UTM Computing Society"
  },
  faculty_admin: {
    firstName: "Faculty",
    lastName: "Admin",
    email: "admin@utm.my",
    matric: "ADMIN001",
    role: "faculty_admin",
    society: "Faculty of Computing"
  }
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRedirectPath(role) {
  if (role === "organiser") return "organiser-dashboard.html";
  if (role === "faculty_admin") return "admin-dashboard.html";
  return "../../index.html";
}

roleChips.forEach(chip => {
  chip.addEventListener("click", () => {
    roleChips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    selectedRole = chip.dataset.role;
  });
});

document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const rememberMe = document.getElementById("rememberMe").checked;
  const errorDiv = document.getElementById("loginError");
  const successDiv = document.getElementById("loginSuccess");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!email || !password) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Please enter both email and password.";
    return;
  }

  if (!isValidEmail(email)) {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Please enter a valid email address.";
    return;
  }

  const registeredUser = JSON.parse(localStorage.getItem("eventora_registered_user") || "null");
  const baseProfile = registeredUser && registeredUser.email === email
    ? registeredUser
    : demoProfiles[selectedRole];

  const sessionUser = {
    ...baseProfile,
    email,
    role: selectedRole
  };

  localStorage.setItem("eventora_session", JSON.stringify({
    isLoggedIn: true,
    rememberMe,
    signedInAt: new Date().toISOString(),
    user: sessionUser
  }));
  localStorage.setItem("userRole", selectedRole);

  successDiv.style.display = "block";
  setTimeout(() => {
    window.location.href = getRedirectPath(selectedRole);
  }, 700);
});
