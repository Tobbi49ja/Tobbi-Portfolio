/* ============================================================
   Shared dynamic-content loader used by all portfolio pages
   ============================================================ */

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const TAG_COLORS = {
  'HTML5': 'tag-red',   'HTML5 & CSS3': 'tag-blue', 'CSS': 'tag-blue',
  'JavaScript': 'tag-yellow', 'Express.js': 'tag-green', 'Express with Node.js': 'tag-green',
  'Express': 'tag-yellow', 'Node.js': 'tag-indigo', 'node.js with Express': 'tag-green',
  'React Native': 'tag-blue', 'React Native & Vite': 'tag-teal', 'React & Vite': 'tag-blue',
  'MongoDB': 'tag-green', 'Python': 'tag-blue', 'Django': 'tag-teal',
  'Svelte': 'tag-orange', 'VPS / Linux': 'tag-indigo',
};

function tagColor(tag) {
  return TAG_COLORS[tag] || 'tag-blue';
}

function projectCardHTML(p) {
  const tags = (p.tags || []).map(t => `<span class="tag ${tagColor(t)}">${esc(t)}</span>`).join('');
  const demo = p.liveDemoUrl
    ? `<a href="${esc(p.liveDemoUrl)}" target="_blank" rel="noopener noreferrer" class="project-link float">Demo <i class="fas fa-eye"></i></a>`
    : '';
  return `
    <div class="project-card">
      <div class="project-img-container">
        <img src="${esc(p.image || '')}" alt="${esc(p.title)}" class="project-img" loading="lazy" onerror="this.style.display='none'" />
      </div>
      <div class="project-content">
        <h3 class="project-title">${esc(p.title)}</h3>
        <p class="project-description">${esc(p.shortDescription || '')}</p>
        <div class="project-tags">${tags}</div>
        <a href="${esc(p.repoUrl || '#')}" target="_blank" rel="noopener noreferrer" class="project-link">
          View Repo <i class="fas fa-arrow-right"></i>
        </a>
        ${demo}
      </div>
    </div>`;
}

function skillsHTML(skills) {
  const tech = skills.filter(s => s.category === 'Technical').sort((a,b) => a.order - b.order);
  const prof = skills.filter(s => s.category === 'Professional').sort((a,b) => a.order - b.order);

  function catBlock(title, list) {
    if (!list.length) return '';
    const pct = s => Math.min(100, Math.max(0, Number(s.percent) || 0));
    return `
      <div class="skills-category">
        <h3 class="skills-category-title">${esc(title)} Skills</h3>
        ${list.map(s => `
          <div class="skill-item">
            <div class="skill-info">
              <span class="skill-name">${esc(s.name)}</span>
              <span class="skill-percent">${pct(s)}%</span>
            </div>
            <div class="skill-bar">
              <div class="skill-progress" data-width="${pct(s)}" style="width:0"></div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  return catBlock('Technical', tech) + catBlock('Professional', prof);
}

function animateSkillBarsIn(container) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const cat = entry.target;

      cat.classList.add('visible');
      const title = cat.querySelector('.skills-category-title');
      if (title) title.classList.add('visible');

      cat.querySelectorAll('.skill-item').forEach((item, i) => {
        setTimeout(() => {
          item.classList.add('visible');
          const bar = item.querySelector('.skill-progress[data-width]');
          if (bar) {
            requestAnimationFrame(() => {
              bar.style.width = bar.dataset.width + '%';
            });
          }
        }, i * 80);
      });

      obs.unobserve(cat);
    });
  }, { threshold: 0.15 });

  container.querySelectorAll('.skills-category').forEach(cat => observer.observe(cat));
}

/* ---------- Home page ---------- */
async function initHomePage() {
  // Load content (hero title, subtitle phrases)
  try {
    const content = await fetch('/api/content').then(r => r.json());
    if (content['hero.title']) {
      const el = document.querySelector('.hero-title');
      if (el) el.textContent = content['hero.title'];
    }
    if (content['hero.subtitlePhrases'] && window._setTypingPhrases) {
      window._setTypingPhrases(content['hero.subtitlePhrases'].split(',').map(s => s.trim()).filter(Boolean));
    }
  } catch {}

  // Load featured projects
  const projContainer = document.getElementById('featured-projects-container');
  if (projContainer) {
    projContainer.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading projects…</div>';
    try {
      const res = await fetch('/api/projects?featured=true');
      if (!res.ok) throw new Error('Server error ' + res.status);
      const projects = await res.json();
      projContainer.innerHTML = projects.length
        ? projects.map(projectCardHTML).join('')
        : '<p style="color:var(--light-text);text-align:center">No featured projects yet.</p>';
      makeVisible(projContainer);
    } catch (e) {
      projContainer.innerHTML = '<p class="error-state">Could not load projects. Please refresh the page.</p>';
    }
  }

  // Load skills
  const skillsContainer = document.getElementById('skills-container');
  if (skillsContainer) {
    skillsContainer.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading skills…</div>';
    try {
      const res = await fetch('/api/skills');
      if (!res.ok) throw new Error('Server error ' + res.status);
      const skills = await res.json();
      skillsContainer.innerHTML = skills.length ? skillsHTML(skills) : '';
      animateSkillBarsIn(skillsContainer);
    } catch {
      skillsContainer.innerHTML = '<p class="error-state">Could not load skills. Please refresh the page.</p>';
    }
  }
}

/* ---------- About page ---------- */
async function initAboutPage() {
  const skillsContainer = document.getElementById('skills-container');
  if (skillsContainer) {
    skillsContainer.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading…</div>';
  }

  try {
    const [contentRes, skillsRes] = await Promise.all([
      fetch('/api/content'),
      fetch('/api/skills'),
    ]);

    const content = contentRes.ok ? await contentRes.json() : {};
    const skills  = skillsRes.ok  ? await skillsRes.json()  : [];

    // Profile picture
    if (content['profile.picture']) {
      document.querySelectorAll('.about-img').forEach(img => { img.src = content['profile.picture']; });
    }
    // About title
    if (content['about.title']) {
      const el = document.querySelector('.about-title');
      if (el) el.textContent = content['about.title'];
    }
    // Bio paragraphs
    const bio = document.getElementById('about-bio');
    if (bio) {
      const paras = [1,2,3].map(n => content[`about.paragraph${n}`]).filter(Boolean);
      bio.innerHTML = paras.length
        ? paras.map(p => `<p class="about-text visible">${esc(p)}</p>`).join('')
        : '';
    }

    // Skills
    if (skillsContainer) {
      skillsContainer.innerHTML = skills.length
        ? skillsHTML(skills)
        : '<p class="error-state">No skills data available.</p>';
      animateSkillBarsIn(skillsContainer);
    }
  } catch (e) {
    if (skillsContainer) {
      skillsContainer.innerHTML = '<p class="error-state">Could not load data. Please refresh the page.</p>';
    }
  }
}

/* ---------- Projects page ---------- */
async function initProjectsPage() {
  const container = document.getElementById('all-projects-container');
  if (!container) return;
  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--light-text);font-family:\'Orbitron\',sans-serif;font-size:0.8rem;letter-spacing:0.1em"><i class="fas fa-circle-notch fa-spin"></i> Loading projects…</div>';
  try {
    const projects = await fetch('/api/projects').then(r => r.json());
    container.innerHTML = projects.length
      ? projects.map(projectCardHTML).join('')
      : '<p style="color:var(--light-text);text-align:center;padding:40px">No projects yet.</p>';
    makeVisible(container);
  } catch (e) {
    container.innerHTML = `<p style="color:var(--light-text);text-align:center">Error loading projects: ${e.message}</p>`;
  }
}

function makeVisible(container) {
  container.querySelectorAll('.project-card').forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('visible');
      card.querySelectorAll('.project-title,.project-description,.tag,.project-link').forEach(el => el.classList.add('visible'));
    }, i * 60);
  });
}
