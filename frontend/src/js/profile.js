document.addEventListener("DOMContentLoaded", () => {
  const storedSession = JSON.parse(localStorage.getItem("eventora_session") || "null");
  const registeredUser = JSON.parse(localStorage.getItem("eventora_registered_user") || "null");

  const fallbackUser = {
    firstName: "Student",
    lastName: "User",
    email: "student@utm.my",
    matric: "A24CS0001",
    role: "attendee",
    society: "General Attendee"
  };

  const user = storedSession?.user || registeredUser || fallbackUser;

  const roleConfig = {
    organiser: {
      label: "Organiser",
      avatar: "OR",
      dashboard: "organiser-dashboard.html"
    },
    faculty_admin: {
      label: "Faculty Admin",
      avatar: "AD",
      dashboard: "admin-dashboard.html"
    },
    attendee: {
      label: "Student",
      avatar: "ST",
      dashboard: "../../index.html"
    }
  };

  const config = roleConfig[user.role] || roleConfig.attendee;

  const roleBadge = document.getElementById("roleBadge");
  const roleBadge2 = document.getElementById("roleBadge2");
  const avatar = document.getElementById("avatarInit");
  const profileName = document.getElementById("profileName");
  const society = document.querySelector(".profile-society");
  const dashboardLink = document.getElementById("dashboardLink");
  const headerDashboard = document.getElementById("headerDashboard");
  const cancelBtn = document.getElementById("cancelBtn");

  if (roleBadge) roleBadge.textContent = config.label;
  if (roleBadge2) roleBadge2.textContent = config.label;
  if (avatar) avatar.textContent = config.avatar;
  if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`;
  if (society) society.textContent = user.society || "EventOra member";
  if (dashboardLink) dashboardLink.href = config.dashboard;
  if (headerDashboard) headerDashboard.href = config.dashboard;
  if (cancelBtn) cancelBtn.href = config.dashboard;

  document.getElementById("pfFirstName").value = user.firstName || "";
  document.getElementById("pfLastName").value = user.lastName || "";
  document.getElementById("pfEmail").value = user.email || "";
  document.getElementById("pfMatric").value = user.matric || "";

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    const updatedUser = {
      ...user,
      firstName: document.getElementById("pfFirstName").value.trim(),
      lastName: document.getElementById("pfLastName").value.trim(),
      email: document.getElementById("pfEmail").value.trim(),
      matric: document.getElementById("pfMatric").value.trim()
    };
    const currentPw = document.getElementById("pfCurrentPw").value;
    const newPw = document.getElementById("pfNewPw").value;
    const confirmPw = document.getElementById("pfConfirmPw").value;
    const errorDiv = document.getElementById("profileError");
    const successDiv = document.getElementById("profileSuccess");

    errorDiv.style.display = "none";
    successDiv.style.display = "none";

    if (!updatedUser.firstName || !updatedUser.lastName || !updatedUser.email) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "First name, last name, and email are required.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedUser.email)) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "Please enter a valid email address.";
      return;
    }

    if (newPw && !currentPw) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "Enter your current password before changing password.";
      return;
    }

    if (newPw && newPw.length < 8) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "Password must be at least 8 characters.";
      return;
    }

    if (newPw && newPw !== confirmPw) {
      errorDiv.style.display = "block";
      errorDiv.textContent = "Passwords do not match.";
      return;
    }

    localStorage.setItem("eventora_registered_user", JSON.stringify(updatedUser));
    localStorage.setItem("eventora_session", JSON.stringify({
      ...(storedSession || {}),
      isLoggedIn: true,
      updatedAt: new Date().toISOString(),
      user: updatedUser
    }));
    localStorage.setItem("userRole", updatedUser.role);

    if (profileName) profileName.textContent = `${updatedUser.firstName} ${updatedUser.lastName}`;
    successDiv.style.display = "block";
  });
});
