// Role chip toggle
const roleChips = document.querySelectorAll('.auth-role-chip');
let selectedRole = 'attendee';

roleChips.forEach(chip => {
  chip.addEventListener('click', () => {
    roleChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedRole = chip.dataset.role;
  });
});

// Login button
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorDiv = document.getElementById('loginError');

  if (!email || !password) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'Please enter both email and password.';
    return;
  }

  errorDiv.style.display = 'none';

  // Simulate login — redirect based on role
  if (selectedRole === 'organiser') {
    window.location.href = 'organiser-dashboard.html';
  } else if (selectedRole === 'faculty_admin') {
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = '../../index.html';
  }
});