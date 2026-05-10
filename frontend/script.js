// Wait for lucide to be available
function initLucide(retries = 20) {
  if (window.lucide) window.lucide.createIcons();
  else if (retries > 0) setTimeout(() => initLucide(retries - 1), 50);
}

document.addEventListener("DOMContentLoaded", () => {
  initLucide();

  // ── Auth Guard ──
  const userData = localStorage.getItem('nexus_user');
  if (!userData) {
    window.location.replace('login.html');
    return;
  }

  const user = JSON.parse(userData);
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) {
    userInfoEl.classList.remove('hidden');
    document.getElementById('userNameDisplay').textContent = user.username;
    document.getElementById('userBadge').textContent = user.role;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('nexus_user');
    window.location.replace('login.html');
  });

  // ── Theme Management ──
  const currentTheme = localStorage.getItem('theme') || 'dark-theme';
  document.body.className = currentTheme;
  updateThemeIcon();

  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.className);
    updateThemeIcon();
  });

  function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-theme');
    const btn = document.getElementById('themeToggle');
    btn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
    initLucide();
  }

  // ── Sidebar ──
  const historySidebar = document.getElementById('historySidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  document.getElementById('historyToggle').addEventListener('click', () => {
    historySidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    renderHistory();
  });

  function closeSidebar() {
    historySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  document.getElementById('closeHistory').addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // ── Classification Mode Tabs ──
  const modeTabs = document.querySelectorAll('.mode-tab');
  const textSection = document.getElementById('textModeSection');
  const fileSection = document.getElementById('fileModeSection');
  const imageSection = document.getElementById('imageModeSection');
  let currentMode = 'text'; // 'text' | 'file' | 'image'

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;

      textSection.classList.add('hidden');
      fileSection.classList.add('hidden');
      imageSection.classList.add('hidden');

      if (currentMode === 'text') {
        textSection.classList.remove('hidden');
        document.querySelector('#aiClassifyButton .btn-text').textContent = 'Analyze Book';
      } else if (currentMode === 'file') {
        fileSection.classList.remove('hidden');
        document.querySelector('#aiClassifyButton .btn-text').textContent = 'Upload & Analyze';
      } else if (currentMode === 'image') {
        imageSection.classList.remove('hidden');
        document.querySelector('#aiClassifyButton .btn-text').textContent = 'Analyze Cover';
      }
      initLucide();
    });
  });

  // ── File Upload Handlers ──
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('aiBookFile');
  const fileSelectedInfo = document.getElementById('fileSelectedInfo');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const uploadContent = document.getElementById('uploadContent');
  const clearFileBtn = document.getElementById('clearFileBtn');

  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  ['dragleave', 'drop'].forEach(evt => {
    uploadZone.addEventListener(evt, e => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
    });
  });

  uploadZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  fileInput.addEventListener('change', e => {
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
      showToast('Invalid file type. Use .txt, .md, or .pdf.', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('File too large. Maximum size is 50 MB.', 'error');
      return;
    }
    fileNameDisplay.textContent = file.name;
    uploadContent.classList.add('hidden');
    fileSelectedInfo.classList.remove('hidden');
    initLucide();
    showToast(`File attached: ${file.name}`, 'success');
  }

  // ── Image Upload Handlers ──
  const imageUploadZone = document.getElementById('imageUploadZone');
  const imageInput = document.getElementById('aiBookImage');
  const imageSelectedInfo = document.getElementById('imageSelectedInfo');
  const imageNameDisplay = document.getElementById('imageNameDisplay');
  const imageUploadContent = document.getElementById('imageUploadContent');
  const clearImageBtn = document.getElementById('clearImageBtn');

  imageUploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    imageUploadZone.classList.add('drag-over');
  });

  ['dragleave', 'drop'].forEach(evt => {
    imageUploadZone.addEventListener(evt, e => {
      e.preventDefault();
      imageUploadZone.classList.remove('drag-over');
    });
  });

  imageUploadZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  });

  imageInput.addEventListener('change', e => {
    if (e.target.files[0]) handleImageSelect(e.target.files[0]);
  });

  clearImageBtn.addEventListener('click', () => {
    imageInput.value = '';
    imageSelectedInfo.classList.add('hidden');
    imageUploadContent.classList.remove('hidden');
  });

  function handleImageSelect(file) {
    const validExts = ['.png', '.jpg', '.jpeg', '.webp'];
    if (!validExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
      showToast('Invalid image type. Use PNG, JPG, or WEBP.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image too large. Maximum size is 10 MB.', 'error');
      return;
    }
    imageNameDisplay.textContent = file.name;
    imageUploadContent.classList.add('hidden');
    imageSelectedInfo.classList.remove('hidden');
    initLucide();
    showToast(`Image attached: ${file.name}`, 'success');
  }

  // ── Form Submission ──
  document.getElementById('aiClassificationForm').addEventListener('submit', async e => {
    e.preventDefault();

    if (currentMode === 'text') {
      const title = document.getElementById('aiBookTitle').value.trim();
      const content = document.getElementById('aiBookContent').value.trim();

      if (!title && !content) {
        showToast('Please enter a book title or summary.', 'error');
        return;
      }

      setLoadingState(true, 'Analyzing...');
      try {
        const result = await classifyWithAI(title, content);
        const displayTitle = title || 'Untitled Analysis';
        displayResults(result.classification, displayTitle);
        saveToHistory(displayTitle, result.classification);
        showToast('Analysis complete!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
        resetEmptyState();
      } finally {
        setLoadingState(false, 'Analyze Book');
      }

    } else if (currentMode === 'file') {
      // File mode
      const file = fileInput.files[0];
      const title = document.getElementById('aiBookTitleFile').value.trim();

      if (!file) {
        showToast('Please select a file to upload.', 'error');
        return;
      }

      setLoadingState(true, 'Processing file...');
      try {
        const result = await uploadFileToAPI(file, title);
        const displayTitle = title || file.name;
        displayResults(result.classification, displayTitle);
        saveToHistory(displayTitle, result.classification);
        showToast('Document analyzed!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
        resetEmptyState();
      } finally {
        setLoadingState(false, 'Upload & Analyze');
      }
    } else if (currentMode === 'image') {
      // Image mode
      const file = imageInput.files[0];

      if (!file) {
        showToast('Please select an image to upload.', 'error');
        return;
      }

      setLoadingState(true, 'Analyzing cover...');
      try {
        const result = await uploadImageToAPI(file);
        const displayTitle = 'Cover Analysis: ' + file.name;
        displayResults(result.classification, displayTitle);
        saveToHistory(displayTitle, result.classification);
        showToast('Cover analyzed!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
        resetEmptyState();
      } finally {
        setLoadingState(false, 'Analyze Cover');
      }
    }
  });

  function setLoadingState(isLoading, loadingText = 'Processing...') {
    const btn = document.getElementById('aiClassifyButton');
    const text = btn.querySelector('.btn-text');
    const icon = btn.querySelector('svg') || btn.querySelector('i[data-lucide]');
    const loader = document.getElementById('aiLoadingSpinner');

    btn.disabled = isLoading;

    if (isLoading) {
      text.textContent = loadingText;
      if (icon) icon.style.display = 'none';
      loader.classList.remove('hidden');

      document.getElementById('emptyState').innerHTML = `
        <div class="pulse-ring"><div class="loader" style="border-color:rgba(99,102,241,0.3);border-top-color:var(--primary);"></div></div>
        <h3 style="font-size:1.35rem;margin-bottom:8px;font-weight:700;">AI is Thinking…</h3>
        <p>Extracting themes, identifying categories, and generating insights.</p>
      `;
      document.getElementById('emptyState').classList.remove('hidden');
      document.getElementById('aiDetailedResult').classList.add('hidden');
    } else {
      if (icon) icon.style.display = '';
      loader.classList.add('hidden');
    }
  }

  function resetEmptyState() {
    document.getElementById('emptyState').innerHTML = `
      <div class="pulse-ring"><i data-lucide="scan-line"></i></div>
      <h3 style="font-size:1.35rem;margin-bottom:8px;font-weight:700;">Ready to Analyze</h3>
      <p>Enter a title, paste a summary, or upload a document to begin AI classification.</p>
    `;
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('aiDetailedResult').classList.add('hidden');
    initLucide();
  }

  // ── API Calls ──
  async function classifyWithAI(title, content) {
    const res = await fetch('http://127.0.0.1:5000/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    return handleApiResponse(res);
  }

  async function uploadFileToAPI(file, title) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    const res = await fetch('http://127.0.0.1:5000/upload-and-classify', {
      method: 'POST',
      body: formData
    });
    return handleApiResponse(res);
  }

  async function uploadImageToAPI(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://127.0.0.1:5000/analyze-image', {
      method: 'POST',
      body: formData
    });
    return handleApiResponse(res);
  }

  async function handleApiResponse(res) {
    let data;
    try { data = await res.json(); }
    catch { throw new Error('Could not connect to the backend server.'); }
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    if (!data.success) throw new Error(data.error || 'Analysis failed.');
    return data;
  }

  // ── Render Results ──
  function displayResults(data, analysisTitle) {
    document.getElementById('emptyState').classList.add('hidden');
    const container = document.getElementById('aiDetailedResult');
    const confidence = Math.round((data.confidence_score || 0) * 100);
    const confColor = confidence >= 75 ? 'var(--success)' : confidence >= 50 ? 'var(--warning)' : 'var(--danger)';

    container.innerHTML = `
      <div class="result-header">
        <div>
          <h2 style="font-size:2rem;margin-bottom:6px;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
            ${escHtml(data.primary_category || 'Uncategorized')}
          </h2>
          <p style="font-weight:600;color:var(--text-main);font-size:1rem;">${escHtml(analysisTitle)}</p>
        </div>
        <div class="score-badge" style="color:${confColor};background:${confColor}18;border-color:${confColor}44;">
          <i data-lucide="target"></i> ${confidence}% match
        </div>
      </div>

      <div class="result-grid">
        <div class="stat-card">
          <span class="stat-label">Est. Read Time</span>
          <span class="stat-value"><i data-lucide="clock" style="width:18px;display:inline;vertical-align:middle;color:var(--accent);margin-right:4px;"></i>${escHtml(String(data.reading_time_estimate || '?'))} hrs</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Difficulty</span>
          <span class="stat-value"><i data-lucide="bar-chart-2" style="width:18px;display:inline;vertical-align:middle;color:var(--primary);margin-right:4px;"></i>${escHtml(data.difficulty_level || 'N/A')}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Content Type</span>
          <span class="stat-value" style="font-size:1.1rem;">${escHtml(data.content_type || 'N/A')}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Target Audience</span>
          <span class="stat-value" style="font-size:1rem;line-height:1.35;">${escHtml(data.target_audience || 'General')}</span>
        </div>
      </div>

      ${data.summary ? `<div class="summary-quote">"${escHtml(data.summary)}"</div>` : ''}

      <h3 class="section-title"><i data-lucide="layers"></i> Categories &amp; Themes</h3>
      <div class="tag-container" style="margin-bottom:24px;">
        ${(data.secondary_categories || []).map(t => `<span class="tag tag-primary">${escHtml(t)}</span>`).join('')}
        ${(data.themes || []).map(t => `<span class="tag tag-secondary">${escHtml(t)}</span>`).join('')}
        ${(data.subject_keywords || []).slice(0, 10).map(t => `<span class="tag" style="background:var(--card-bg);border:1px solid var(--border-color);">${escHtml(t)}</span>`).join('')}
      </div>

      <h3 class="section-title"><i data-lucide="lightbulb"></i> Key Insights</h3>
      <ul class="insight-list" style="margin-bottom:24px;">
        ${(data.key_insights || []).map(i => `<li>${escHtml(i)}</li>`).join('')}
      </ul>

      ${(data.related_topics || []).length > 0 ? `
        <h3 class="section-title"><i data-lucide="link-2"></i> Related Literature</h3>
        <div class="tag-container">
          ${data.related_topics.map(t => `<span class="tag" style="background:var(--card-bg);border:1px solid var(--border-color);">${escHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
    `;

    container.classList.remove('hidden');
    initLucide();

    if (window.innerWidth <= 1024) {
      setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Toast ──
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

  // ── History ──
  function saveToHistory(title, classification) {
    let history = JSON.parse(localStorage.getItem('nexus_history') || '[]');
    history.unshift({
      id: Date.now(),
      title,
      category: classification.primary_category,
      date: new Date().toLocaleDateString(),
      data: classification
    });
    if (history.length > 25) history.pop();
    localStorage.setItem('nexus_history', JSON.stringify(history));
  }

  function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('nexus_history') || '[]');
    if (history.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:24px;">No analyses yet.</p>';
      return;
    }
    list.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-title">${escHtml(item.title)}</div>
        <div class="history-item-meta">
          <span>${escHtml(item.category || 'Uncategorized')}</span>
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

  // expose closeSidebar to outer scope used in event handlers
  function closeSidebar() {
    historySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }
});

// ── Books Explorer (loaded from books_data.json) ────────────────────────────
(function () {
  let allBooks = [];
  let activeGenre = 'All';
  let currentPage = 1;
  const itemsPerPage = 50;
  let currentFilteredBooks = [];

  const GENRE_COLORS = {
    'Fantasy': '#818cf8', 'Science Fiction': '#06b6d4', 'Thriller': '#ef4444',
    'Mystery': '#f59e0b', 'Romance': '#ec4899', 'Horror': '#8b5cf6',
    'Biography': '#10b981', 'Memoir': '#14b8a6', 'Self-Help': '#3b82f6',
    'Historical Fiction': '#d97706', 'Fiction': '#6366f1', 'Non-Fiction': '#94a3b8',
    'Poetry': '#a78bfa', 'Adventure': '#22c55e', 'Young Adult': '#f472b6',
    'Dystopian': '#dc2626', 'Classic': '#92400e', 'Philosophy': '#7c3aed',
    'Psychology': '#0891b2', 'Science': '#059669', 'Business': '#ca8a04',
    'Finance': '#16a34a', 'Spirituality': '#9333ea', 'Travel': '#0284c7',
    'Education': '#15803d', 'Autobiography': '#be185d', "Children's": '#65a30d',
    'Graphic Novel': '#7e22ce', 'Contemporary': '#0369a1', 'True Crime': '#9f1239'
  };

  function genreColor(g) { return GENRE_COLORS[g] || '#6366f1'; }

  function renderGenreFilters(genres) {
    const bar = document.getElementById('booksGenreBar');
    if (!bar) return;
    const all = ['All', ...genres];
    
    // Create a searchable dropdown structure
    bar.innerHTML = `
      <div class="genre-selector-container" style="position: relative; width: 100%;">
        <div class="genre-search-wrapper" style="position: relative;">
          <i data-lucide="filter" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; color: var(--text-muted);"></i>
          <input type="text" id="genreSearchInput" class="books-search" placeholder="Search and select a genre..." style="padding-left: 42px; cursor: pointer;" autocomplete="off">
          <i data-lucide="chevron-down" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); width: 18px; color: var(--text-muted); pointer-events: none;"></i>
        </div>
        <div id="genreDropdownList" class="genre-dropdown-list hidden">
          ${all.map(g => `<div class="genre-option ${g === 'All' ? 'active' : ''}" data-genre="${g}">${g}</div>`).join('')}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('genreSearchInput');
    const dropdownList = document.getElementById('genreDropdownList');
    
    // Initial value
    searchInput.value = activeGenre === 'All' ? '' : activeGenre;
    if (activeGenre === 'All') searchInput.placeholder = 'All Genres (Search...)';

    // Toggle dropdown
    searchInput.addEventListener('focus', () => {
      dropdownList.classList.remove('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!bar.contains(e.target)) {
        dropdownList.classList.add('hidden');
        searchInput.value = activeGenre === 'All' ? '' : activeGenre;
      }
    });

    // Filter genres
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      dropdownList.classList.remove('hidden');
      dropdownList.querySelectorAll('.genre-option').forEach(opt => {
        const text = opt.textContent.toLowerCase();
        opt.style.display = text.includes(term) ? 'block' : 'none';
      });
    });

    // Select genre
    dropdownList.querySelectorAll('.genre-option').forEach(opt => {
      opt.addEventListener('click', () => {
        activeGenre = opt.dataset.genre;
        dropdownList.querySelectorAll('.genre-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        searchInput.value = activeGenre === 'All' ? '' : activeGenre;
        searchInput.placeholder = activeGenre === 'All' ? 'All Genres (Search...)' : 'Search genres...';
        dropdownList.classList.add('hidden');
        filterAndRender();
      });
    });
    
    initLucide();
  }

  function renderBooks(books, totalCount) {
    const grid = document.getElementById('booksGrid');
    const count = document.getElementById('booksCount');
    if (!grid) return;
    if (count) count.textContent = `${totalCount} book${totalCount !== 1 ? 's' : ''}`;
    if (!books.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:40px 0;">No books found.</p>';
      return;
    }
    const col = genreColor;
    grid.innerHTML = books.map(b => `
      <div class="book-card" style="border-color:${col(b.genre)}33;">
        <div class="book-card-header" style="background:linear-gradient(135deg,${col(b.genre)}22,${col(b.genre)}11);">
          <span class="book-genre-tag" style="background:${col(b.genre)}22;color:${col(b.genre)};border-color:${col(b.genre)}44;">${b.genre}</span>
          <span class="book-rating">⭐ ${b.rating}</span>
        </div>
        <div class="book-card-body">
          <h4 class="book-title">${escHtmlBook(b.title)}</h4>
          <p class="book-author">by ${escHtmlBook(b.author)}</p>
          <p class="book-desc">${escHtmlBook(b.description)}</p>
          <div class="book-meta">
            <span>📅 ${b.year > 0 ? b.year : Math.abs(b.year) + ' BC'}</span>
            <span>📄 ${b.pages} pages</span>
          </div>
          <button class="book-classify-btn" onclick="classifyFromBook('${escHtmlBook(b.title)}','${escHtmlBook(b.description)}')"
            style="border-color:${col(b.genre)}66;color:${col(b.genre)};">
            🧠 Classify This
          </button>
        </div>
      </div>`).join('');
  }

  function filterAndRender() {
    const search = (document.getElementById('booksSearch')?.value || '').toLowerCase();
    let filtered = allBooks;
    if (activeGenre !== 'All') filtered = filtered.filter(b => b.genre === activeGenre);
    if (search) filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(search) ||
      b.author.toLowerCase().includes(search) ||
      b.description.toLowerCase().includes(search));
    
    currentFilteredBooks = filtered;
    currentPage = 1;
    renderBooksPage();
  }

  function renderBooksPage() {
    const totalPages = Math.ceil(currentFilteredBooks.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const booksToRender = currentFilteredBooks.slice(startIdx, endIdx);

    renderBooks(booksToRender, currentFilteredBooks.length);
    renderPaginationControls(totalPages);
  }

  function renderPaginationControls(totalPages) {
    let paginationContainer = document.getElementById('booksPagination');
    if (!paginationContainer) {
      paginationContainer = document.createElement('div');
      paginationContainer.id = 'booksPagination';
      paginationContainer.className = 'books-pagination';
      const explorerContainer = document.getElementById('booksExplorer').querySelector('.container');
      explorerContainer.appendChild(paginationContainer);
    }

    if (currentFilteredBooks.length === 0) {
        paginationContainer.innerHTML = '';
        return;
    }

    paginationContainer.innerHTML = `
      <button class="btn btn-outline" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
      <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
      <button class="btn btn-outline" id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderBooksPage();
        document.getElementById('booksExplorer').scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderBooksPage();
        document.getElementById('booksExplorer').scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    });
  }

  function escHtmlBook(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  window.classifyFromBook = function(title, desc) {
    document.getElementById('aiBookTitle').value = title;
    document.getElementById('aiBookContent').value = desc;
    const textTab = document.querySelector('.mode-tab[data-mode="text"]');
    if (textTab) {
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      textTab.classList.add('active');
      document.getElementById('textModeSection')?.classList.remove('hidden');
      document.getElementById('fileModeSection')?.classList.add('hidden');
      document.getElementById('imageModeSection')?.classList.add('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToastBook('Book loaded! Click "Analyze Book" to classify.', 'success');
  };

  function showToastBook(msg, type) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('fade-out'); t.addEventListener('animationend', () => t.remove()); }, 3000);
  }

  function injectBooksSection() {
    if (document.getElementById('booksExplorer')) return;
    const section = document.createElement('section');
    section.id = 'booksExplorer';
    section.className = 'books-explorer';
    section.innerHTML = `
      <div class="container">
        <div class="books-header">
          <div>
            <h2 class="books-title">📚 Books Explorer</h2>
            <p class="books-subtitle">Browse our dataset of <strong>600+ books</strong> across <strong>100+ genres</strong>. Click any book to auto-fill the classifier.</p>
          </div>
          <span id="booksCount" class="books-count-badge">600+ books</span>
        </div>
        <div class="books-filters-layout" style="display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap;">
          <div class="books-search-wrap" style="flex: 2; min-width: 280px; margin-bottom: 0;">
            <input id="booksSearch" class="books-search" type="text" placeholder="🔍 Search books, authors, or descriptions...">
          </div>
          <div id="booksGenreBar" class="books-genre-bar" style="flex: 1; min-width: 240px; margin-bottom: 0;"></div>
        </div>
        <div id="booksGrid" class="books-grid"></div>
      </div>`;
    document.body.insertBefore(section, document.querySelector('.toast-container'));
    document.getElementById('booksSearch').addEventListener('input', filterAndRender);
  }

  function addBooksStyles() {
    const s = document.createElement('style');
    s.textContent = `
      .books-explorer{padding:48px 0;border-top:1px solid var(--border-color);}
      .books-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px;}
      .books-title{font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:6px;}
      .books-subtitle{color:var(--text-muted);font-size:0.92rem;}
      .books-count-badge{padding:6px 14px;border-radius:99px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);color:var(--primary);font-weight:700;font-size:0.85rem;white-space:nowrap;}
      .books-search-wrap{margin-bottom:20px;}
      .books-search{width:100%;padding:13px 18px;border-radius:14px;border:1.5px solid var(--border-color);background:var(--card-bg);color:var(--text-main);font-size:0.95rem;font-family:inherit;outline:none;transition:all 0.25s;}
      .books-search:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-glow);}
      .genre-dropdown-list{position:absolute;top:100%;left:0;right:0;margin-top:8px;background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:14px;max-height:300px;overflow-y:auto;z-index:100;box-shadow:0 10px 40px rgba(0,0,0,0.6);padding:8px;}
      .genre-option{padding:10px 16px;border-radius:8px;cursor:pointer;font-size:0.9rem;color:var(--text-main);transition:all 0.2s;}
      .genre-option:hover{background:rgba(99,102,241,0.1);color:var(--primary);}
      .genre-option.active{background:var(--primary);color:#fff;font-weight:600;}
      .books-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
      .book-card{background:var(--card-bg);border:1px solid var(--border-color);border-radius:16px;overflow:hidden;transition:all 0.25s;display:flex;flex-direction:column;}
      .book-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.2);}
      .book-card-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;}
      .book-genre-tag{font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:99px;border:1px solid;}
      .book-rating{font-size:0.8rem;font-weight:600;color:var(--text-muted);}
      .book-card-body{padding:14px;display:flex;flex-direction:column;flex:1;}
      .book-title{font-size:0.97rem;font-weight:700;color:var(--text-main);margin-bottom:4px;line-height:1.35;}
      .book-author{font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;}
      .book-desc{font-size:0.82rem;color:var(--text-muted);line-height:1.55;margin-bottom:10px;flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
      .book-meta{display:flex;gap:12px;font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;}
      .book-classify-btn{width:100%;padding:8px;border-radius:10px;border:1.5px solid;background:transparent;font-size:0.83rem;font-weight:600;cursor:pointer;transition:all 0.2s;}
      .book-classify-btn:hover{opacity:0.8;transform:translateY(-1px);}
      .books-pagination{display:flex;justify-content:center;align-items:center;gap:20px;margin-top:32px;padding-bottom:12px;}
      .pagination-info{font-weight:600;color:var(--text-main);font-size:0.95rem;}
    `;
    document.head.appendChild(s);
  }

  fetch('books_data.json')
    .then(r => r.json())
    .then(data => {
      allBooks = data.books || [];
      addBooksStyles();
      injectBooksSection();
      renderGenreFilters(data.genres || []);
      
      currentFilteredBooks = allBooks;
      renderBooksPage();
    })
    .catch(() => console.warn('books_data.json not found — Books Explorer disabled.'));
})();

