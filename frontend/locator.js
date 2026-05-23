// ── Book Locator — locator.js ─────────────────────────────────────────────────
const API = 'http://127.0.0.1:5000';

let allLocations = [];
let currentUser  = null;
let pendingDeleteId = null;

// Area colour palette — consistent hash per area name
const AREA_COLORS = [
  '#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#3b82f6','#84cc16',
  '#d97706','#0891b2','#7c3aed','#be185d','#059669'
];

function areaColor(area) {
  let h = 0;
  for (let i = 0; i < area.length; i++) h = area.charCodeAt(i) + ((h << 5) - h);
  return AREA_COLORS[Math.abs(h) % AREA_COLORS.length];
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function initLucide(retries = 20) {
  if (window.lucide) window.lucide.createIcons();
  else if (retries > 0) setTimeout(() => initLucide(retries - 1), 50);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLucide();

  // Auth guard
  const userData = localStorage.getItem('nexus_user');
  if (!userData) {
    window.location.replace('login.html');
    return;
  }
  currentUser = JSON.parse(userData);

  // Role guard — locator is exclusively for library role
  if (currentUser.role !== 'library') {
    window.location.replace('index.html');
    return;
  }

  const isLibrarian = true; // at this point role is always 'library'

  // Header: user badge
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) {
    userInfoEl.classList.remove('hidden');
    document.getElementById('userNameDisplay').textContent = currentUser.username;
    document.getElementById('userBadge').textContent = currentUser.role === 'library' ? 'Librarian' : 'Reader';
  }

  // Theme
  const savedTheme = localStorage.getItem('theme') || 'dark-theme';
  document.body.className = savedTheme;
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

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('nexus_user');
    window.location.replace('login.html');
  });

  // Librarian toolbar
  if (isLibrarian) {
    document.getElementById('librarianBar').classList.remove('hidden');
    document.getElementById('addLocationBtn').addEventListener('click', () => openPanel(null));
  }

  // Load all locations
  loadLocations();

  // Live search with 300ms debounce
  let searchTimer;
  document.getElementById('locatorSearch').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => filterAndRender(e.target.value.trim()), 300);
  });

  // Panel controls
  document.getElementById('closePanelBtn').addEventListener('click', closePanel);
  document.getElementById('cancelPanelBtn').addEventListener('click', closePanel);
  document.getElementById('panelOverlay').addEventListener('click', closePanel);

  // Form submit
  document.getElementById('locationForm').addEventListener('submit', handleSave);

  // Delete modal buttons
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteModalOverlay').classList.add('hidden');
    pendingDeleteId = null;
  });
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

// ── Data Loading ──────────────────────────────────────────────────────────────
async function loadLocations() {
  try {
    const res  = await fetch(`${API}/locations`);
    const data = await res.json();
    if (data.success) {
      allLocations = data.locations;
      updateStats();
      document.getElementById('statsRow').classList.remove('hidden');
      filterAndRender(document.getElementById('locatorSearch').value.trim());
    } else {
      showToast('Failed to load locations.', 'error');
    }
  } catch {
    showToast('Could not connect to the backend server.', 'error');
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent   = allLocations.length;
  document.getElementById('statAreas').textContent   = new Set(allLocations.map(l => l.area)).size;
  document.getElementById('statShelves').textContent = new Set(allLocations.map(l => l.shelf)).size;
}

// ── Render ────────────────────────────────────────────────────────────────────
function filterAndRender(query = '') {
  const q = query.toLowerCase();
  const filtered = q
    ? allLocations.filter(loc =>
        loc.book_title.toLowerCase().includes(q) ||
        loc.author.toLowerCase().includes(q)     ||
        loc.area.toLowerCase().includes(q)       ||
        loc.shelf.toLowerCase().includes(q)
      )
    : allLocations;

  renderLocations(filtered, query);

  const countEl = document.getElementById('locatorCount');
  if (q) {
    countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
    countEl.classList.remove('hidden');
  } else {
    countEl.classList.add('hidden');
  }
}

function renderLocations(locations, query = '') {
  const grid     = document.getElementById('locatorGrid');
  const empty    = document.getElementById('locatorEmpty');
  const emptyMsg = document.getElementById('locatorEmptyMsg');
  const isLib    = currentUser && currentUser.role === 'library';

  if (!locations.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    emptyMsg.textContent = query
      ? `No books matched "${query}". Try a different search term.`
      : 'No books have been located yet. A librarian can add locations using the button above.';
    return;
  }

  empty.classList.add('hidden');

  grid.innerHTML = locations.map(loc => {
    const color = areaColor(loc.area);
    const date  = (loc.updated_at || '').split('T')[0];
    return `
      <article class="loc-card reveal" style="border-color:${color}33;" data-id="${loc.id}" role="listitem">
        <div class="loc-card-header" style="background:linear-gradient(135deg,${color}22,${color}08);">
          <div class="loc-pin" style="background:${color}1a;color:${color};border:1.5px solid ${color}44;">
            <i data-lucide="map-pin" style="width:13px;height:13px;"></i>
            Located
          </div>
          ${isLib ? `
            <div class="loc-actions">
              <button class="loc-action-btn" onclick="editLocation(${loc.id})" title="Edit location" aria-label="Edit">
                <i data-lucide="pencil" style="width:14px;height:14px;"></i>
              </button>
              <button class="loc-action-btn danger" onclick="deleteLocation(${loc.id}, '${esc(loc.book_title)}')" title="Delete location" aria-label="Delete">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              </button>
            </div>
          ` : ''}
        </div>
        <div class="loc-card-body">
          <h4 class="loc-book-title">${esc(loc.book_title)}</h4>
          ${loc.author ? `<p class="loc-book-author">by ${esc(loc.author)}</p>` : ''}

          <div class="loc-badges">
            <span class="loc-badge area-badge" style="background:${color}15;color:${color};border-color:${color}44;">
              <i data-lucide="layout-grid" style="width:12px;height:12px;"></i>
              ${esc(loc.area)}
            </span>
            <span class="loc-badge shelf-badge">
              <i data-lucide="archive" style="width:12px;height:12px;"></i>
              ${esc(loc.shelf)}
            </span>
          </div>

          ${loc.notes ? `
            <p class="loc-notes">
              <i data-lucide="sticky-note" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;opacity:0.6;"></i>
              ${esc(loc.notes)}
            </p>` : ''}

          <div class="loc-meta">
            <span>Added by <strong>${esc(loc.added_by)}</strong></span>
            <span>${date}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  initLucide();
}

// ── Panel (Add / Edit) ────────────────────────────────────────────────────────
function openPanel(loc) {
  const isEdit = !!loc;
  document.getElementById('panelTitle').textContent = isEdit ? 'Edit Location' : 'Add Book Location';
  document.getElementById('editLocationId').value   = isEdit ? loc.id : '';
  document.getElementById('locBookTitle').value     = isEdit ? loc.book_title : '';
  document.getElementById('locAuthor').value        = isEdit ? (loc.author || '') : '';
  document.getElementById('locArea').value          = isEdit ? loc.area : '';
  document.getElementById('locShelf').value         = isEdit ? loc.shelf : '';
  document.getElementById('locNotes').value         = isEdit ? (loc.notes || '') : '';
  document.getElementById('saveLocationBtn').querySelector('.btn-text').textContent =
    isEdit ? 'Update Location' : 'Save Location';

  document.getElementById('locationPanel').classList.remove('hidden');
  document.getElementById('panelOverlay').classList.remove('hidden');
  // Trigger CSS transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('locationPanel').classList.add('open');
    });
  });
  setTimeout(() => document.getElementById('locBookTitle').focus(), 350);
  initLucide();
}

function closePanel() {
  document.getElementById('locationPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.add('hidden');
  setTimeout(() => {
    document.getElementById('locationPanel').classList.add('hidden');
    document.getElementById('locationForm').reset();
    document.getElementById('editLocationId').value = '';
  }, 350);
}

// ── Global: called from inline onclick in cards ───────────────────────────────
window.editLocation = function (id) {
  const loc = allLocations.find(l => l.id === id);
  if (loc) openPanel(loc);
};

window.deleteLocation = function (id, title) {
  pendingDeleteId = id;
  document.getElementById('deleteModalMsg').textContent =
    `Remove the location entry for "${title}"? This cannot be undone.`;
  document.getElementById('deleteModalOverlay').classList.remove('hidden');
  initLucide();
};

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" style="width:16px;height:16px;"></i> Deleting…';
  initLucide();

  try {
    const res  = await fetch(`${API}/locations/${pendingDeleteId}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: currentUser.role })
    });
    const data = await res.json();
    if (data.success) {
      allLocations = allLocations.filter(l => l.id !== pendingDeleteId);
      filterAndRender(document.getElementById('locatorSearch').value.trim());
      updateStats();
      showToast('Location removed successfully.', 'success');
    } else {
      showToast(data.error || 'Failed to delete.', 'error');
    }
  } catch {
    showToast('Connection error.', 'error');
  } finally {
    pendingDeleteId = null;
    document.getElementById('deleteModalOverlay').classList.add('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="trash-2" style="width:16px;height:16px;"></i> Delete';
    initLucide();
  }
}

// ── Save (Add / Update) ───────────────────────────────────────────────────────
async function handleSave(e) {
  e.preventDefault();

  const id      = document.getElementById('editLocationId').value;
  const spinner = document.getElementById('savingSpinner');
  const saveBtn = document.getElementById('saveLocationBtn');
  const btnText = saveBtn.querySelector('.btn-text');

  const body = {
    book_title: document.getElementById('locBookTitle').value.trim(),
    author:     document.getElementById('locAuthor').value.trim(),
    area:       document.getElementById('locArea').value.trim(),
    shelf:      document.getElementById('locShelf').value.trim(),
    notes:      document.getElementById('locNotes').value.trim(),
    added_by:   currentUser.username,
    role:       currentUser.role
  };

  if (!body.book_title || !body.area || !body.shelf) {
    showToast('Book title, area, and shelf are required.', 'error');
    return;
  }

  saveBtn.disabled = true;
  btnText.textContent = 'Saving…';
  spinner.classList.remove('hidden');

  try {
    const url    = id ? `${API}/locations/${id}` : `${API}/locations`;
    const method = id ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Location updated!' : 'Location added!', 'success');
      closePanel();
      await loadLocations();
    } else {
      showToast(data.error || 'Failed to save.', 'error');
    }
  } catch {
    showToast('Connection error. Is the backend running?', 'error');
  } finally {
    saveBtn.disabled = false;
    btnText.textContent = id ? 'Update Location' : 'Save Location';
    spinner.classList.add('hidden');
  }
}
