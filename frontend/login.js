// Wait for lucide to be ready before creating icons
function initLucide(retries = 20) {
  if (window.lucide) {
    window.lucide.createIcons();
  } else if (retries > 0) {
    setTimeout(() => initLucide(retries - 1), 50);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLucide();

  // Redirect if already logged in (instant, no delay)
  if (localStorage.getItem('nexus_user')) {
    window.location.replace('index.html');
    return;
  }

  // Tabs logic
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
      initLucide();
    });
  });

  // Role selector logic
  const roleOptions = document.querySelectorAll('.role-option');
  const roleInput = document.getElementById('registerRole');

  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      roleOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      roleInput.value = option.dataset.role;
    });
  });

  // Toast System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    initLucide();
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  }

  // Set loading state on buttons
  function setLoading(btnId, loaderId, isLoading, defaultText) {
    const btn = document.getElementById(btnId);
    const text = btn.querySelector('.btn-text');
    const icon = btn.querySelector('svg') || btn.querySelector('i[data-lucide]');
    const loader = document.getElementById(loaderId);
    btn.disabled = isLoading;
    if (isLoading) {
      text.textContent = 'Please wait...';
      if (icon) icon.style.display = 'none';
      if (loader) loader.classList.remove('hidden');
    } else {
      text.textContent = defaultText;
      if (icon) icon.style.display = '';
      if (loader) loader.classList.add('hidden');
    }
  }

  // Input field highlight effect
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => {
      input.closest('.input-wrapper')?.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.closest('.input-wrapper')?.classList.remove('focused');
    });
  });

  // Login Submit
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    setLoading('loginBtn', 'loginLoader', true, 'Authenticate');

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      showToast("Welcome back, " + username + "!", "success");

      localStorage.setItem('nexus_user', JSON.stringify({
        username: data.username,
        role: data.role
      }));

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);

    } catch (err) {
      showToast(err.message, "error");
      setLoading('loginBtn', 'loginLoader', false, 'Authenticate');
      // Shake animation on error
      const card = document.querySelector('.auth-container');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
    }
  });

  // Register Submit
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const role = document.getElementById('registerRole').value;

    if (!username || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading('registerBtn', 'registerLoader', true, 'Create Account');

    try {
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      showToast("Account created! Logging you in...", "success");

      // Automatically log the user in after registration
      setTimeout(async () => {
        try {
          const loginRes = await fetch(`${BACKEND_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();

          if (!loginRes.ok) throw new Error(loginData.error || "Login failed");

          localStorage.setItem('nexus_user', JSON.stringify({
            username: loginData.username,
            role: loginData.role
          }));

          window.location.href = 'index.html';
        } catch (loginErr) {
          showToast(loginErr.message, "error");
          setLoading('registerBtn', 'registerLoader', false, 'Create Account');
        }
      }, 800);

    } catch (err) {
      showToast(err.message, "error");
      setLoading('registerBtn', 'registerLoader', false, 'Create Account');
    }
  });
});
