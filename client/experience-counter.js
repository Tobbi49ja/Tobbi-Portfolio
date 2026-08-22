/* ============================================================
   SHARED DYNAMIC EXPERIENCE COUNTER
   Single source of truth for elapsed-time counters.
   Used by BOTH portfolio versions (new + old). This file is
   mirrored byte-for-byte into legacy-client/ so each tree is
   self-contained, but the logic lives in exactly one place.
   ============================================================ */

const EXPERIENCE_UNITS = ['days', 'months', 'years'];
const EXPERIENCE_DEFAULT_UNIT = 'years';
const EXPERIENCE_UNIT_KEY = 'portfolioExperienceUnit';

// Start date is configurable from the admin panel via the
// `experience.startDate` site-content key (format YYYY-MM-DD).
// Until it is set, the counter shows 0 rather than NaN.
let EXPERIENCE_START_DATE = null;
let _startDatePromise = null;

/* Fetch the start date from the shared content API (cached). */
function loadExperienceStartDate() {
  if (EXPERIENCE_START_DATE) return Promise.resolve();
  if (_startDatePromise) return _startDatePromise;
  _startDatePromise = (async () => {
    try {
      const res  = await fetch('/api/content');
      const data = await res.json();
      const raw  = data && data['experience.startDate'];
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) EXPERIENCE_START_DATE = d;
      }
    } catch (e) { /* API unavailable — fall back below */ }
    // Fall back to "today" so the counter reads 0 until configured.
    if (!EXPERIENCE_START_DATE) EXPERIENCE_START_DATE = new Date();
  })();
  return _startDatePromise;
}

/* Elapsed time from the configured start date to today, floored for the
   given unit. Days/Months/Years never round up — they floor to whole units. */
function experienceElapsed(unit) {
  if (!EXPERIENCE_START_DATE) return 0;
  const s  = new Date(EXPERIENCE_START_DATE.getFullYear(), EXPERIENCE_START_DATE.getMonth(), EXPERIENCE_START_DATE.getDate());
  const n  = new Date();
  const nrm = new Date(n.getFullYear(), n.getMonth(), n.getDate());

  if (unit === 'days') {
    return Math.max(0, Math.floor((nrm - s) / 86400000));
  }

  if (unit === 'months') {
    let m = (nrm.getFullYear() - s.getFullYear()) * 12 + (nrm.getMonth() - s.getMonth());
    if (nrm.getDate() < s.getDate()) m -= 1;
    return Math.max(0, m);
  }

  // years
  let y = nrm.getFullYear() - s.getFullYear();
  if (nrm.getMonth() < s.getMonth() ||
      (nrm.getMonth() === s.getMonth() && nrm.getDate() < s.getDate())) y -= 1;
  return Math.max(0, y);
}

function experienceFormat(n) {
  return Number(n).toLocaleString('en-US');
}

function experienceSingular(unit) {
  return unit.charAt(unit.length - 1) === 's' ? unit.slice(0, -1) : unit;
}

function experienceUnitLabel(unit, value) {
  return value === 1 ? experienceSingular(unit) : unit;
}

function experienceCurrentUnit() {
  try {
    const saved = localStorage.getItem(EXPERIENCE_UNIT_KEY);
    if (EXPERIENCE_UNITS.includes(saved)) return saved;
  } catch (e) { /* localStorage unavailable */ }
  return EXPERIENCE_DEFAULT_UNIT;
}

/* Build the inline `<number> <unit-select>` markup for a sentence. */
function experienceCounterHTML(unit) {
  const value = experienceElapsed(unit);
  return (
    '<span class="experience-counter">' +
      '<span class="experience-counter-value">' + experienceFormat(value) + '</span> ' +
      '<select class="experience-counter-unit" aria-label="Experience unit">' +
        EXPERIENCE_UNITS.map(u =>
          '<option value="' + u + '"' + (u === unit ? ' selected' : '') + '>' + u + '</option>'
        ).join('') +
      '</select>' +
    '</span>'
  );
}

/* Initialize the counter UI inside an existing container element.
   `container` should contain `.experience-counter-value` and
   `.experience-counter-unit` rendered by experienceCounterHTML(). */
function initExperienceCounter(container) {
  if (!container) return;
  const valueEl   = container.querySelector('.experience-counter-value');
  const selectEl  = container.querySelector('.experience-counter-unit');
  if (!valueEl || !selectEl) return;

  function render() {
    const unit = selectEl.value;
    try { localStorage.setItem(EXPERIENCE_UNIT_KEY, unit); } catch (e) { /* ignore */ }
    valueEl.textContent = experienceFormat(experienceElapsed(unit));
  }

  selectEl.addEventListener('change', render);
  render(); // auto-recompute elapsed time on load
}

/* In a block of already-escaped text, replace a static experience token
   like "8 months" with the live counter markup, then initialize it.
   `escapedHtml` is the paragraph HTML; returns the new HTML string.
   The user's previously-selected unit (default: years) is used. */
function insertExperienceCounterInto(escapedHtml) {
  // Match "with|over|for|during <N> month(s)|year(s)" and swap the number+unit.
  const re = /(\bwith\b|\bover\b|\bfor\b|\bduring\b)\s+(\d+(?:,\d+)*)\s+(months?|years?)\b/i;
  const match = re.exec(escapedHtml);
  if (!match) return escapedHtml;
  const unit   = experienceCurrentUnit();
  const before = escapedHtml.slice(0, match.index + match[1].length);
  const after  = escapedHtml.slice(match.index + match[0].length);
  return before + ' ' + experienceCounterHTML(unit) + after;
}

/* Initialize static experience-counter placeholders
   (`<span data-experience-counter>` on home pages) once the start date
   has loaded. */
async function initStaticExperienceCounters() {
  await loadExperienceStartDate();
  document.querySelectorAll('[data-experience-counter]').forEach(el => {
    el.innerHTML = experienceCounterHTML(experienceCurrentUnit());
    initExperienceCounter(el);
  });
}