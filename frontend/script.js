document.addEventListener("DOMContentLoaded", () => {
  // Initialize Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Auth Check
  const userData = localStorage.getItem('nexus_user');
  if (!userData) {
    window.location.href = 'login.html';
    return;
  }
  
  const user = JSON.parse(userData);
  const userInfoEl = document.getElementById('userInfo');
  if(userInfoEl) {
    userInfoEl.classList.remove('hidden');
    document.getElementById('userNameDisplay').textContent = user.username;
    document.getElementById('userBadge').textContent = user.role;
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('nexus_user');
      window.location.href = 'login.html';
    });
  }

  // Elements
  const themeToggle = document.getElementById("themeToggle");
  const historyToggle = document.getElementById("historyToggle");
  const closeHistory = document.getElementById("closeHistory");
  const historySidebar = document.getElementById("historySidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const form = document.getElementById("aiClassificationForm");
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("aiBookFile");
  const fileSelectedInfo = document.getElementById("fileSelectedInfo");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const clearFileBtn = document.getElementById("clearFileBtn");
  const uploadContent = document.querySelector(".upload-content");
  
  // Theme Management
  const currentTheme = localStorage.getItem('theme') || 'dark-theme';
  document.body.className = currentTheme;
  updateThemeIcon();

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.className);
    updateThemeIcon();
  });

  function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }

  // Sidebar History Management
  historyToggle.addEventListener('click', () => {
    historySidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    renderHistory();
  });

  closeHistory.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  function closeSidebar() {
    historySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  // File Upload Handlers
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  ['dragleave', 'drop'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
    });
  });

  uploadZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
  });

  clearFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileSelectedInfo.classList.add('hidden');
    uploadContent.classList.remove('hidden');
  });

  function handleFileSelect(file) {
    const validExts = ['.txt', '.md', '.pdf'];
    if (!validExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
      showToast('Invalid file type. Only .txt, .md, .pdf allowed.', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('File too large. Max 50MB.', 'error');
      return;
    }
    
    // Assign to input if dropped (requires DataTransfer API workaround for security reasons, we just mimic visual state here for simplicity)
    fileNameDisplay.textContent = file.name;
    uploadContent.classList.add('hidden');
    fileSelectedInfo.classList.remove('hidden');
    showToast(`File attached: ${file.name}`, 'success');
  }

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('aiBookTitle').value.trim();
    const content = document.getElementById('aiBookContent').value.trim();
    const file = fileInput.files[0];

    if (!content && !file) {
      showToast('Please provide text content or upload a file.', 'error');
      return;
    }

    setLoadingState(true);
    
    try {
      let result;
      if (file) {
        result = await uploadFileToAPI(file, title);
      } else {
        result = await classifyWithAI(title, content);
      }
      
      const displayTitle = title || (file ? file.name : 'Untitled Analysis');
      displayResults(result.classification, displayTitle);
      saveToHistory(displayTitle, result.classification);
      showToast('Analysis complete!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
      document.getElementById('emptyState').classList.remove('hidden');
      document.getElementById('aiDetailedResult').classList.add('hidden');
    } finally {
      setLoadingState(false);
    }
  });

  function setLoadingState(isLoading) {
    const btn = document.getElementById('aiClassifyButton');
    const text = btn.querySelector('.btn-text');
    const icon = btn.querySelector('svg') || btn.querySelector('i');
    const loader = document.getElementById('aiLoadingSpinner');
    
    btn.disabled = isLoading;
    if (isLoading) {
      text.textContent = 'Processing...';
      if (icon) icon.classList.add('hidden');
      if (loader) loader.classList.remove('hidden');
      
      // Update right panel
      document.getElementById('emptyState').innerHTML = `
        <div class="pulse-ring"><div class="loader"></div></div>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">Neural Network Active</h3>
        <p>Extracting insights, identifying themes, and categorizing content...</p>
      `;
      document.getElementById('emptyState').classList.remove('hidden');
      document.getElementById('aiDetailedResult').classList.add('hidden');
    } else {
      text.textContent = 'Initialize Analysis';
      if (icon) icon.classList.remove('hidden');
      if (loader) loader.classList.add('hidden');
      
      // Reset empty state if it fails
      document.getElementById('emptyState').innerHTML = `
        <div class="pulse-ring"><i data-lucide="scan-line"></i></div>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">Awaiting Data</h3>
        <p>Submit a book to view AI classification insights.</p>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // API Functions
  async function classifyWithAI(title, content) {
    const res = await fetch("http://127.0.0.1:5000/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    return handleApiResponse(res);
  }

  async function uploadFileToAPI(file, title) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    
    const res = await fetch("http://127.0.0.1:5000/upload-and-classify", {
      method: "POST",
      body: formData
    });
    return handleApiResponse(res);
  }

  async function handleApiResponse(res) {
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error("Failed to connect to backend server.");
    }
    if (!res.ok) throw new Error(data.error || `HTTP Error ${res.status}`);
    if (!data.success) throw new Error("API returned failure.");
    return data;
  }

  // Rendering Results
  function displayResults(data, analysisTitle) {
    document.getElementById('emptyState').classList.add('hidden');
    const container = document.getElementById('aiDetailedResult');
    
    const confidence = Math.round((data.confidence_score || 0) * 100);
    
    container.innerHTML = `
      <div class="result-header">
        <div>
          <h2 style="font-size: 2.2rem; margin-bottom: 6px; background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            ${data.primary_category || 'Uncategorized'}
          </h2>
          <p style="font-weight: 500; color: var(--text-main); font-size: 1.1rem;">${analysisTitle}</p>
        </div>
        <div class="score-badge">
          <i data-lucide="target"></i> ${confidence}% Match
        </div>
      </div>

      <div class="result-grid">
        <div class="stat-card">
          <span class="stat-label">Read Time</span>
          <span class="stat-value"><i data-lucide="clock" style="width: 22px; display:inline; vertical-align:middle; color:var(--accent); margin-right:4px;"></i> ${data.reading_time_estimate || '?'} hrs</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Difficulty</span>
          <span class="stat-value"><i data-lucide="bar-chart" style="width: 22px; display:inline; vertical-align:middle; color:var(--primary); margin-right:4px;"></i> ${data.difficulty_level || 'N/A'}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Content Type</span>
          <span class="stat-value">${data.content_type || 'N/A'}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Target Audience</span>
          <span class="stat-value" style="font-size: 1.1rem; line-height: 1.3;">${data.target_audience || 'General'}</span>
        </div>
      </div>

      <p style="font-size: 1.1rem; line-height: 1.7; border-left: 4px solid var(--primary); padding-left: 16px; margin-bottom: 32px; font-style: italic;">
        "${data.summary || 'No summary generated.'}"
      </p>

      <h3 class="section-title"><i data-lucide="layers"></i> Categories & Themes</h3>
      <div class="tag-container" style="margin-bottom: 24px;">
        ${(data.secondary_categories || []).map(t => `<span class="tag tag-primary">${t}</span>`).join('')}
        ${(data.themes || []).map(t => `<span class="tag tag-secondary">${t}</span>`).join('')}
        ${(data.subject_keywords || []).map(t => `<span class="tag" style="background: rgba(100,116,139,0.1); border: 1px solid var(--border-color);">${t}</span>`).slice(0, 8).join('')}
      </div>

      <h3 class="section-title"><i data-lucide="lightbulb"></i> Key Insights</h3>
      <ul class="insight-list" style="margin-bottom: 24px;">
        ${(data.key_insights || []).map(i => `<li>${i}</li>`).join('')}
      </ul>

      <h3 class="section-title"><i data-lucide="link"></i> Related Literature</h3>
      <div class="tag-container">
        ${(data.related_topics || []).map(t => `<span class="tag" style="background: rgba(100,116,139,0.1); border: 1px solid var(--border-color); color: var(--text-main);">${t}</span>`).join('')}
      </div>
    `;
    
    container.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    
    if (window.innerWidth <= 1024) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Toast System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    
    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  // History System (Local Storage)
  function saveToHistory(title, classification) {
    let history = JSON.parse(localStorage.getItem('nexus_history') || '[]');
    const entry = {
      id: Date.now(),
      title,
      category: classification.primary_category,
      date: new Date().toLocaleDateString(),
      data: classification
    };
    history.unshift(entry);
    if(history.length > 20) history.pop();
    localStorage.setItem('nexus_history', JSON.stringify(history));
  }

  function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('nexus_history') || '[]');
    
    if (history.length === 0) {
      list.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:20px;">No history found.</p>';
      return;
    }

    list.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-title">${item.title}</div>
        <div class="history-item-meta">
          <span>${item.category || 'Uncategorized'}</span>
          <span>${item.date}</span>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const item = history.find(h => h.id === id);
        if (item) {
          displayResults(item.data, item.title);
          closeSidebar();
          showToast('Loaded from history');
        }
      });
    });
  }
});
