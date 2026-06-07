document.addEventListener("DOMContentLoaded", () => {

  const userRole = localStorage.getItem("userRole") || "attendee";

  // ROLE CONFIG
  const roleConfig = {
    organiser: {
      label: "Organiser",
      avatar: "OR",
      name: "Lee Mei Shuet",
      dashboard: "organiser-dashboard.html"
    },
    faculty_admin: {
      label: "Faculty Admin",
      avatar: "AD",
      name: "Admin User",
      dashboard: "admin-dashboard.html"
    },
    attendee: {
      label: "Student",
      avatar: "ST",
      name: "Student User",
      dashboard: "../../index.html"
    }
  };

  const config = roleConfig[userRole] || roleConfig.attendee;

  // UI UPDATE
  const roleBadge = document.getElementById("roleBadge");
  const roleBadge2 = document.getElementById("roleBadge2");
  const avatar = document.getElementById("avatarInit");
  const profileName = document.getElementById("profileName");

  if (roleBadge) roleBadge.textContent = config.label;
  if (roleBadge2) roleBadge2.textContent = config.label;

  if (avatar) avatar.textContent = config.avatar;
  if (profileName) profileName.textContent = config.name;

  // NAVIGATION CONTROL
  const dashboardLink = document.getElementById("dashboardLink");
  const headerDashboard = document.getElementById("headerDashboard");
  const cancelBtn = document.getElementById("cancelBtn");

  if (dashboardLink) dashboardLink.href = config.dashboard;
  if (headerDashboard) headerDashboard.href = config.dashboard;
  if (cancelBtn) cancelBtn.href = config.dashboard;

  // FORM PREFILL (fake DB
  const fakeDB = {
    organiser: {
      firstName: "Mei",
      lastName: "Shuet",
      email: "mei@utm.my",
      matric: "A24CS0102"
    },
    faculty_admin: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@utm.my",
      matric: "ADMIN001"
    },
    attendee: {
      firstName: "Student",
      lastName: "User",
      email: "student@utm.my",
      matric: "A24CS0001"
    }
  };

  const data = fakeDB[userRole] || fakeDB.attendee;

  const pfFirstName = document.getElementById("pfFirstName");
  const pfLastName = document.getElementById("pfLastName");
  const pfEmail = document.getElementById("pfEmail");
  const pfMatric = document.getElementById("pfMatric");

  if (pfFirstName) pfFirstName.value = data.firstName;
  if (pfLastName) pfLastName.value = data.lastName;
  if (pfEmail) pfEmail.value = data.email;
  if (pfMatric) pfMatric.value = data.matric;

  // SAVE BUTTON
  const saveBtn = document.getElementById("saveProfileBtn");

  if (!saveBtn) return;

  saveBtn.addEventListener("click", () => {

    const newPw = document.getElementById("pfNewPw").value;
    const confirmPw = document.getElementById("pfConfirmPw").value;

    const errorDiv = document.getElementById("profileError");
    const successDiv = document.getElementById("profileSuccess");

    if (errorDiv) errorDiv.style.display = "none";
    if (successDiv) successDiv.style.display = "none";

    if (newPw && newPw.length < 8) {
      if (errorDiv) {
        errorDiv.style.display = "block";
        errorDiv.textContent = "Password must be at least 8 characters.";
      }
      return;
    }

    if (newPw && newPw !== confirmPw) {
      if (errorDiv) {
        errorDiv.style.display = "block";
        errorDiv.textContent = "Passwords do not match.";
      }
      return;
    }

    if (successDiv) successDiv.style.display = "block";

    setTimeout(() => {
      window.location.href = config.dashboard;
    }, 1500);

  });

});