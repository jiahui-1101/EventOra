// Role option styling
document.querySelectorAll('input[name="role"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('role-active'));
    radio.closest('.role-option').classList.add('role-active');
  });
});

// Register button
document.getElementById('registerBtn').addEventListener('click', () => {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const errorDiv = document.getElementById('registerError');

  if (!firstName || !lastName || !email || !password || !confirm) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'Please fill in all fields.';
    return;
  }
  if (password.length < 8) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'Password must be at least 8 characters.';
    return;
  }
  if (password !== confirm) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'Passwords do not match.';
    return;
  }

  errorDiv.style.display = 'none';
  // Simulate success — redirect to login
  alert('Account created successfully! Please sign in.');
  window.location.href = 'login.html';
});