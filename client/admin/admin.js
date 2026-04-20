/* ============================================================
   ADMIN PANEL — Main Logic
   ============================================================ */

const API = '';  // same origin

// ── State ───────────────────────────────────────────────────────────────────
let token         = localStorage.getItem('admin_token');
let currentSection = 'projects';
let allProjects   = [];
let allSkills     = [];
let allContent    = {};

// ── Utilities ───────────────────────────────────────────────────────────────
function $id(id) { return document.getElementById(id); }

function toast(msg, type = 'success') {
  const el = $id('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

function showModal(html) {
  $id('modal-body').innerHTML = html;
  $id('modal-overlay').classList.remove('hidden');
  setTimeout(() => $id('modal-overlay').querySelector('input,textarea,select')?.focus(), 50);
}

function closeModal() {
  $id('modal-overlay').classList.add('hidden');
  $id('modal-body').innerHTML = '';
}

// ── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data; // { url, publicId }
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function login(password) {
  const data = await apiFetch('POST', '/api/admin/login', { password });
  token = data.token;
  localStorage.setItem('admin_token', token);
}

function logout() {
  token = null;
  localStorage.removeItem('admin_token');
  location.reload();
}

async function verifyToken() {
  try {
    await apiFetch('GET', '/api/admin/verify');
    return true;
  } catch {
    return false;
  }
}

// ── App shell ────────────────────────────────────────────────────────────────
function showApp() {
  $id('login-screen').classList.add('hidden');
  $id('app').classList.remove('hidden');
  loadSection('projects');
}

function showLogin() {
  $id('login-screen').classList.remove('hidden');
  $id('app').classList.add('hidden');
}

function showSection(name) {
  currentSection = name;
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $id(`section-${name}`).classList.add('active');
  document.querySelector(`.nav-item[data-section="${name}"]`).classList.add('active');

  const headings = { projects: 'Projects', skills: 'Skills', content: 'Site Content' };
  $id('section-heading').textContent = headings[name];

  const addBtn = $id('add-btn');
  if (name === 'content') { addBtn.classList.add('hidden'); }
  else { addBtn.classList.remove('hidden'); addBtn.innerHTML = `<i class="fas fa-plus"></i> Add ${name === 'projects' ? 'Project' : 'Skill'}`; }

  loadSection(name);
}

async function loadSection(name) {
  if (name === 'projects') await loadProjects();
  else if (name === 'skills') await loadSkills();
  else if (name === 'content') await loadContent();
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────
async function loadProjects() {
  $id('projects-table-wrap').innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading…</div>';
  try {
    allProjects = await apiFetch('GET', '/api/projects');
    renderProjectsTable();
  } catch (e) {
    $id('projects-table-wrap').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
}

function renderProjectsTable() {
  if (!allProjects.length) {
    $id('projects-table-wrap').innerHTML = '<div class="empty-state">No projects yet. Click "Add Project" to begin.</div>';
    return;
  }
  $id('projects-table-wrap').innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Thumb</th>
          <th>Title</th>
          <th>Tags</th>
          <th>Featured</th>
          <th>Order</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${allProjects.map(p => `
          <tr>
            <td><img src="${p.image || ''}" alt="${p.title}" onerror="this.style.display='none'" /></td>
            <td><strong>${p.title}</strong></td>
            <td style="font-size:0.78rem;color:var(--muted)">${(p.tags||[]).slice(0,3).join(', ')}</td>
            <td><span class="badge ${p.featured ? 'badge-yes' : 'badge-no'}">${p.featured ? 'Yes' : 'No'}</span></td>
            <td style="color:var(--muted)">${p.order}</td>
            <td>
              <div class="table-actions">
                <button class="btn-icon edit" onclick="openProjectModal('${p._id}')" title="Edit"><i class="fas fa-pen"></i></button>
                <button class="btn-icon del"  onclick="deleteProject('${p._id}', '${p.title.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function openProjectModal(id) {
  const p = id ? allProjects.find(x => x._id === id) : {};
  const title = id ? 'Edit Project' : 'New Project';
  showModal(`
    <h2>${title}</h2>
    <form id="project-form">
      <div class="field-row">
        <div class="field-group">
          <label>Slug / ID *</label>
          <input type="text" name="id" value="${p.id||''}" placeholder="my-project" required />
        </div>
        <div class="field-group">
          <label>Order</label>
          <input type="number" name="order" value="${p.order ?? 0}" min="0" />
        </div>
      </div>
      <div class="field-group">
        <label>Title *</label>
        <input type="text" name="title" value="${esc(p.title||'')}" required />
      </div>
      <div class="field-group">
        <label>Short Description</label>
        <textarea name="shortDescription">${esc(p.shortDescription||'')}</textarea>
      </div>
      <div class="field-group">
        <label>Writeup</label>
        <textarea name="writeup" style="min-height:110px">${esc(p.writeup||'')}</textarea>
      </div>
      <div class="field-group">
        <label>Writeup 2 (optional)</label>
        <textarea name="writeup2">${esc(p.writeup2||'')}</textarea>
      </div>
      <div class="field-row">
        <div class="field-group">
          <label>Repo URL</label>
          <input type="url" name="repoUrl" value="${esc(p.repoUrl||'')}" />
        </div>
        <div class="field-group">
          <label>Live Demo URL</label>
          <input type="url" name="liveDemoUrl" value="${esc(p.liveDemoUrl||'')}" />
        </div>
      </div>
      <div class="field-group">
        <label>Tags (comma-separated)</label>
        <input type="text" name="tags" value="${(p.tags||[]).join(', ')}" placeholder="HTML5, CSS, JavaScript" />
      </div>
      <div class="field-group">
        <label>Project Image</label>
        ${p.image ? `<div class="img-preview-wrap"><img src="${p.image}" alt="current" /></div>` : ''}
        <input type="file" name="imageFile" accept="image/*" id="proj-img-file" />
        <img id="proj-img-preview" class="img-upload-preview" />
        <p class="upload-status" id="proj-upload-status"></p>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" name="featured" id="proj-featured" ${p.featured ? 'checked' : ''} />
        <label for="proj-featured">Show on home page (Featured)</label>
      </div>
    </form>
    <div class="modal-actions">
      <button class="btn-cyber" onclick="closeModal()">Cancel</button>
      <button class="btn-cyber green" onclick="saveProject('${id||''}')">
        <i class="fas fa-save"></i> Save Project
      </button>
    </div>
  `);

  // Image preview
  $id('proj-img-file').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const preview = $id('proj-img-preview');
    preview.src = url; preview.style.display = 'block';
  });
}

async function saveProject(id) {
  const form = document.getElementById('project-form');
  const fd   = new FormData(form);
  const statusEl = $id('proj-upload-status');

  const data = {
    id:               fd.get('id').trim(),
    title:            fd.get('title').trim(),
    shortDescription: fd.get('shortDescription').trim(),
    writeup:          fd.get('writeup').trim(),
    writeup2:         fd.get('writeup2').trim(),
    repoUrl:          fd.get('repoUrl').trim() || '#',
    liveDemoUrl:      fd.get('liveDemoUrl').trim(),
    tags:             fd.get('tags').split(',').map(t => t.trim()).filter(Boolean),
    featured:         form.querySelector('[name="featured"]').checked,
    order:            parseInt(fd.get('order')) || 0,
  };

  // Handle image upload
  const file = form.querySelector('[name="imageFile"]').files[0];
  if (file) {
    statusEl.textContent = '⏳ Uploading image…';
    try {
      const { url, publicId } = await uploadImage(file);
      data.image = url;
      data.imagePublicId = publicId;
      statusEl.textContent = '✅ Image uploaded';
    } catch (e) {
      statusEl.textContent = `❌ Upload failed: ${e.message}`;
      return;
    }
  } else if (!id) {
    // Keep existing image if editing without a new file
    const existing = allProjects.find(p => p._id === id);
    if (existing) data.image = existing.image;
  }

  try {
    if (id) {
      await apiFetch('PUT', `/api/projects/${id}`, data);
      toast('Project updated');
    } else {
      await apiFetch('POST', '/api/projects', data);
      toast('Project created');
    }
    closeModal();
    await loadProjects();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function deleteProject(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    await apiFetch('DELETE', `/api/projects/${id}`);
    toast('Project deleted');
    await loadProjects();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── SKILLS ────────────────────────────────────────────────────────────────────
async function loadSkills() {
  $id('skills-grid-wrap').innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading…</div>';
  try {
    allSkills = await apiFetch('GET', '/api/skills');
    renderSkillsGrid();
  } catch (e) {
    $id('skills-grid-wrap').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
}

function renderSkillsGrid() {
  const tech = allSkills.filter(s => s.category === 'Technical');
  const prof = allSkills.filter(s => s.category === 'Professional');

  $id('skills-grid-wrap').innerHTML = `
    ${renderSkillCategory('Technical', tech)}
    ${renderSkillCategory('Professional', prof)}
  `;
}

function renderSkillCategory(label, skills) {
  return `
    <div class="skill-category-block">
      <h3>${label} Skills</h3>
      ${skills.length ? skills.map(s => `
        <div class="skill-admin-row">
          <span class="skill-admin-name">${esc(s.name)}</span>
          <span class="skill-admin-pct">${s.percent}%</span>
          <div class="table-actions">
            <button class="btn-icon edit" onclick="openSkillModal('${s._id}')" title="Edit"><i class="fas fa-pen"></i></button>
            <button class="btn-icon del"  onclick="deleteSkill('${s._id}', '${esc(s.name)}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('') : '<p class="empty-state" style="padding:16px">No skills in this category.</p>'}
    </div>`;
}

function openSkillModal(id) {
  const s = id ? allSkills.find(x => x._id === id) : {};
  showModal(`
    <h2>${id ? 'Edit' : 'New'} Skill</h2>
    <form id="skill-form">
      <div class="field-group">
        <label>Skill Name *</label>
        <input type="text" name="name" value="${esc(s.name||'')}" required placeholder="e.g. Svelte" />
      </div>
      <div class="field-row">
        <div class="field-group">
          <label>Proficiency % *</label>
          <input type="number" name="percent" value="${s.percent ?? 80}" min="0" max="100" required />
        </div>
        <div class="field-group">
          <label>Order</label>
          <input type="number" name="order" value="${s.order ?? 0}" min="0" />
        </div>
      </div>
      <div class="field-group">
        <label>Category *</label>
        <select name="category">
          <option value="Technical"    ${s.category === 'Technical'    ? 'selected' : ''}>Technical</option>
          <option value="Professional" ${s.category === 'Professional' ? 'selected' : ''}>Professional</option>
        </select>
      </div>
    </form>
    <div class="modal-actions">
      <button class="btn-cyber" onclick="closeModal()">Cancel</button>
      <button class="btn-cyber green" onclick="saveSkill('${id||''}')">
        <i class="fas fa-save"></i> Save Skill
      </button>
    </div>
  `);
}

async function saveSkill(id) {
  const form = document.getElementById('skill-form');
  const data = {
    name:     form.querySelector('[name="name"]').value.trim(),
    percent:  parseInt(form.querySelector('[name="percent"]').value),
    category: form.querySelector('[name="category"]').value,
    order:    parseInt(form.querySelector('[name="order"]').value) || 0,
  };
  if (!data.name) return toast('Name is required', 'error');

  try {
    if (id) { await apiFetch('PUT', `/api/skills/${id}`, data); toast('Skill updated'); }
    else     { await apiFetch('POST', '/api/skills', data);     toast('Skill added'); }
    closeModal();
    await loadSkills();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function deleteSkill(id, name) {
  if (!confirm(`Delete skill "${name}"?`)) return;
  try {
    await apiFetch('DELETE', `/api/skills/${id}`);
    toast('Skill deleted');
    await loadSkills();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── SITE CONTENT ──────────────────────────────────────────────────────────────
async function loadContent() {
  $id('content-panels-wrap').innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading…</div>';
  try {
    allContent = await apiFetch('GET', '/api/content');
    renderContentPanels();
  } catch (e) {
    $id('content-panels-wrap').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
}

function renderContentPanels() {
  $id('content-panels-wrap').innerHTML = `

    <!-- Hero -->
    <div class="content-panel-group">
      <h3><i class="fas fa-home"></i> &nbsp;Hero Section</h3>
      <div class="content-field">
        <label>Hero Title</label>
        <input type="text" id="c-hero-title" value="${esc(allContent['hero.title']||"Hi, I'm Tobbi")}" />
        <button class="btn-cyber" style="margin-top:8px" onclick="saveContent('hero.title', $id('c-hero-title').value)">
          <i class="fas fa-save"></i> Save
        </button>
      </div>
      <div class="content-field">
        <label>Subtitle Phrases (comma-separated)</label>
        <input type="text" id="c-hero-phrases" value="${esc(allContent['hero.subtitlePhrases']||'')}" placeholder="Full-Stack Developer,UI/UX Designer,Creative Builder" />
        <button class="btn-cyber" style="margin-top:8px" onclick="saveContent('hero.subtitlePhrases', $id('c-hero-phrases').value)">
          <i class="fas fa-save"></i> Save
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="content-panel-group">
      <h3><i class="fas fa-user-astronaut"></i> &nbsp;About Section</h3>
      <div class="content-field">
        <label>Section Title</label>
        <input type="text" id="c-about-title" value="${esc(allContent['about.title']||'Who am I?')}" />
        <button class="btn-cyber" style="margin-top:8px" onclick="saveContent('about.title', $id('c-about-title').value)">
          <i class="fas fa-save"></i> Save
        </button>
      </div>
      ${[1,2,3].map(n => `
      <div class="content-field">
        <label>Bio Paragraph ${n}</label>
        <textarea id="c-about-p${n}">${esc(allContent[`about.paragraph${n}`]||'')}</textarea>
        <button class="btn-cyber" style="margin-top:8px" onclick="saveContent('about.paragraph${n}', $id('c-about-p${n}').value)">
          <i class="fas fa-save"></i> Save
        </button>
      </div>`).join('')}
      <div class="content-field">
        <label>Profile Picture</label>
        <div class="img-preview-wrap">
          <img id="profile-pic-preview" src="${allContent['profile.picture']||'/assets/pic/profile/Profile.jpg'}" alt="Profile" />
        </div>
        <input type="file" id="profile-pic-file" accept="image/*" />
        <p class="upload-status" id="profile-upload-status"></p>
        <button class="btn-cyber" style="margin-top:8px" onclick="uploadProfilePicture()">
          <i class="fas fa-upload"></i> Upload New Picture
        </button>
      </div>
    </div>

    <!-- Contact -->
    <div class="content-panel-group">
      <h3><i class="fas fa-satellite-dish"></i> &nbsp;Contact Info</h3>
      ${[
        { key:'contact.email',    label:'Email',    id:'c-email' },
        { key:'contact.phone',    label:'Phone',    id:'c-phone' },
        { key:'contact.location', label:'Location', id:'c-location' },
      ].map(f => `
      <div class="content-field">
        <label>${f.label}</label>
        <input type="text" id="${f.id}" value="${esc(allContent[f.key]||'')}" />
        <button class="btn-cyber" style="margin-top:8px" onclick="saveContent('${f.key}', $id('${f.id}').value)">
          <i class="fas fa-save"></i> Save
        </button>
      </div>`).join('')}
    </div>
  `;
}

async function saveContent(key, value) {
  try {
    await apiFetch('PUT', `/api/content/${key}`, { value });
    allContent[key] = value;
    toast('Saved');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function uploadProfilePicture() {
  const file = $id('profile-pic-file').files[0];
  if (!file) return toast('Select an image first', 'error');
  const statusEl = $id('profile-upload-status');
  statusEl.textContent = '⏳ Uploading…';
  try {
    const { url } = await uploadImage(file);
    await saveContent('profile.picture', url);
    $id('profile-pic-preview').src = url;
    statusEl.textContent = '✅ Picture updated';
  } catch (e) {
    statusEl.textContent = `❌ ${e.message}`;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Event wiring ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Login
  $id('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $id('login-btn');
    const err = $id('login-error');
    btn.textContent = 'Connecting…'; btn.disabled = true;
    err.classList.add('hidden');
    try {
      await login($id('login-pass').value);
      showApp();
    } catch (ex) {
      err.textContent = ex.message || 'Invalid password';
      err.classList.remove('hidden');
      btn.innerHTML = '<i class="fas fa-unlock-alt"></i> Access System';
      btn.disabled = false;
    }
  });

  // Logout
  $id('logout-btn').addEventListener('click', logout);

  // Nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => { e.preventDefault(); showSection(item.dataset.section); });
  });

  // Add new button
  $id('add-btn').addEventListener('click', () => {
    if (currentSection === 'projects') openProjectModal(null);
    else if (currentSection === 'skills') openSkillModal(null);
  });

  // Modal close
  $id('modal-close').addEventListener('click', closeModal);
  $id('modal-overlay').addEventListener('click', (e) => { if (e.target === $id('modal-overlay')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Init
  if (token) {
    const valid = await verifyToken();
    if (valid) showApp();
    else { token = null; localStorage.removeItem('admin_token'); showLogin(); }
  } else {
    showLogin();
  }
});

// Expose globals for inline onclick handlers
window.openProjectModal = openProjectModal;
window.deleteProject    = deleteProject;
window.saveProject      = saveProject;
window.openSkillModal   = openSkillModal;
window.deleteSkill      = deleteSkill;
window.saveSkill        = saveSkill;
window.saveContent      = saveContent;
window.uploadProfilePicture = uploadProfilePicture;
window.closeModal       = closeModal;
window.$id              = $id;
