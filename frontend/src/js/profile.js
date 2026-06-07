document.getElementById('saveProfileBtn').addEventListener('click', () => {
  const newPw = document.getElementById('pfNewPw').value;
  const confirmPw = document.getElementById('pfConfirmPw').value;
  const errorDiv = document.getElementById('profileError');
  const successDiv = document.getElementById('profileSuccess');

  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  if (newPw && newPw.length < 8) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'New password must be at least 8 characters.';
    return;
  }
  if (newPw && newPw !== confirmPw) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'Passwords do not match.';
    return;
  }

  successDiv.style.display = 'block';
  setTimeout(() => { window.location.href = 'organiser-dashboard.html'; }, 1500);
});