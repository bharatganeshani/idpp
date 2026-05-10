document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();

  // Redirect if already logged in
  if (localStorage.getItem('nexus_user')) {
    window.location.href = 'index.html';
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
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  // Set loading state
  function setLoading(btnId, loaderId, isLoading, defaultText) {
    const btn = document.getElementById(btnId);
    const text = btn.querySelector('.btn-text');
    const icon = btn.querySelector('svg') || btn.querySelector('i');
    const loader = document.getElementById(loaderId);
    
    btn.disabled = isLoading;
    if (isLoading) {
      text.textContent = 'Please wait...';
      if (icon) icon.classList.add('hidden');
      if (loader) loader.classList.remove('hidden');
    } else {
      text.textContent = defaultText;
      if (icon) icon.classList.remove('hidden');
      if (loader) loader.classList.add('hidden');
    }
  }

  // Login Submit
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    setLoading('loginBtn', 'loginLoader', true, 'Authenticate', 'arrow-right');
    
    try {
      const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      showToast("Authentication successful", "success");
      
      // Save user to local storage
      localStorage.setItem('nexus_user', JSON.stringify({
        username: data.username,
        role: data.role
      }));
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      
    } catch (err) {
      showToast(err.message, "error");
      setLoading('loginBtn', 'loginLoader', false, 'Authenticate', 'arrow-right');
    }
  });

  // Register Submit
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const role = document.getElementById('registerRole').value;
    
    setLoading('registerBtn', 'registerLoader', true, 'Create Account', 'user-plus');
    
    try {
      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      showToast("Account created! You can now log in.", "success");
      
      // Switch back to login tab
      setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').focus();
        setLoading('registerBtn', 'registerLoader', false, 'Create Account', 'user-plus');
      }, 1500);
      
    } catch (err) {
      showToast(err.message, "error");
      setLoading('registerBtn', 'registerLoader', false, 'Create Account', 'user-plus');
    }
  });

});
