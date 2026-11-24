/**
 * Saans — Frontend Application
 *
 * Mobile-first air quality planning assistant.
 * Communicates with the FastAPI backend via JSON API.
 */

'use strict';

// --- State ---
const state = {
  currentTab: 'setup',
  cities: [],
  profile: null,
  currentPlan: null,
  airContext: null,
  sources: {},
  isGenerating: false,
  isSampleProfile: false,
  revision: 0,
};

// --- Sample Profiles ---
const SAMPLE_PROFILES = {
  parent: {
    label: '👨‍👧 School-run parent (Delhi, sample data)',
    city: 'delhi',
    routine_blocks: [
      { label: 'School drop-off', start_time: '08:00', end_time: '08:45', is_fixed: true, location: 'commute' },
      { label: 'School pick-up', start_time: '14:00', end_time: '14:45', is_fixed: true, location: 'commute' },
    ],
    available_transport: ['walk', 'public_transit', 'auto_rickshaw'],
    budget_band: 'low',
    has_purifier: false,
    has_exhaust_fan: true,
    has_cross_ventilation: true,
    indoor_cooking_fuel: 'lpg',
    has_children: true,
    has_elderly: false,
    has_respiratory_concern: false,
    flexibility_minutes: 30,
  },
  worker: {
    label: '👷 Outdoor worker (Delhi, sample data)',
    city: 'delhi',
    routine_blocks: [
      { label: 'Work shift', start_time: '09:00', end_time: '17:00', is_fixed: true, location: 'outdoor' },
    ],
    available_transport: ['walk', 'public_transit', 'motorcycle'],
    budget_band: 'zero',
    has_purifier: false,
    has_exhaust_fan: true,
    has_cross_ventilation: false,
    indoor_cooking_fuel: 'lpg',
    has_children: false,
    has_elderly: true,
    has_respiratory_concern: false,
    flexibility_minutes: 15,
  },
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadCities();
  await loadSources();
  setupEventListeners();
  setupFlexibilitySlider();
  updateSampleBannerForMode();
});

async function loadCities() {
  try {
    const res = await fetch('/api/cities');
    if (res.ok) {
      state.cities = await res.json();
      const select = document.getElementById('city-select');
      state.cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city.key;
        opt.textContent = city.label;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Failed to load cities:', err);
  }
}

async function loadSources() {
  try {
    const res = await fetch('/api/sources');
    if (res.ok) {
      const sources = await res.json();
      sources.forEach(s => { state.sources[s.id] = s; });
      renderSources();
    }
  } catch (err) {
    console.error('Failed to load sources:', err);
  }
}

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('setup-form').addEventListener('input', () => { state.revision++; });

  // Form submission
  document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createPlan();
  });

  // Keyboard navigation for tabs
  document.querySelector('.tab-nav').addEventListener('keydown', (e) => {
    const tabs = [...document.querySelectorAll('.tab')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight'
        ? tabs[(idx + 1) % tabs.length]
        : tabs[(idx - 1 + tabs.length) % tabs.length];
      next.focus();
      next.click();
    }
  });
}

function setupFlexibilitySlider() {
  const slider = document.getElementById('flexibility');
  const output = document.getElementById('flexibility-value');
  if (slider && output) {
    slider.addEventListener('input', () => {
      output.textContent = `${slider.value} min`;
    });
  }
}

async function updateSampleBannerForMode() {
  try {
    const res = await fetch('/health');
    if (res.ok) {
      const health = await res.json();
      const note = document.getElementById('sample-note');
      if (note) {
        if (health.data_mode === 'fixture') {
          note.textContent = '⚠ Sample profile data — not real people. Synthetic environmental test data is configured. Check the returned plan for its data source and time.';
        } else {
          note.textContent = '⚠ Sample profile data — not real people. Live environmental data is requested when you create a plan; availability and freshness are shown with the result.';
        }
      }
    }
  } catch (err) {
    // Silently continue; the static text is an acceptable fallback.
  }
}

// --- Tab Switching ---
function switchTab(tabName) {
  state.currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.tab').forEach(t => {
    const isActive = t.dataset.tab === tabName;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => {
    const isActive = v.id === `view-${tabName}`;
    v.classList.toggle('active', isActive);
    v.hidden = !isActive;
  });
}

// --- Sample Profiles ---
function loadSampleProfile(type) {
  const sample = typeof type === 'object' ? type : SAMPLE_PROFILES[type];
  if (!sample) return;

  state.isSampleProfile = typeof type === 'string';
  state.revision++;

  // Set city
  document.getElementById('city-select').value = sample.city;

  // Set routine blocks
  const container = document.getElementById('routine-blocks');
  container.innerHTML = '';
  sample.routine_blocks.forEach(block => {
    addRoutineBlock(block.label, block.start_time, block.end_time);
  });

  // Set transport
  document.querySelectorAll('[name="transport"]').forEach(cb => {
    cb.checked = sample.available_transport.includes(cb.value);
  });

  // Set budget
  document.querySelectorAll('[name="budget"]').forEach(r => {
    r.checked = r.value === sample.budget_band;
  });

  // Set resources
  document.getElementById('has-purifier').checked = sample.has_purifier;
  document.getElementById('has-exhaust-fan').checked = sample.has_exhaust_fan;
  document.getElementById('has-cross-ventilation').checked = sample.has_cross_ventilation;
  document.getElementById('cooking-fuel').value = sample.indoor_cooking_fuel;

  // Set household needs
  document.getElementById('has-children').checked = sample.has_children;
  document.getElementById('has-elderly').checked = sample.has_elderly;
  document.getElementById('has-respiratory').checked = sample.has_respiratory_concern;
  document.getElementById('has-mobility').checked = !!sample.has_mobility_limitation;

  // Set flexibility
  const slider = document.getElementById('flexibility');
  slider.value = sample.flexibility_minutes;
  document.getElementById('flexibility-value').textContent = `${sample.flexibility_minutes} min`;
}

// --- Routine Blocks ---
function addRoutineBlock(label = '', startTime = '09:00', endTime = '17:00') {
  const container = document.getElementById('routine-blocks');
  const block = document.createElement('div');
  block.className = 'routine-block';
  block.innerHTML = `
    <input type="text" placeholder="e.g., School drop-off" value="${escapeHtml(label)}"
           aria-label="Commitment name" class="routine-label">
    <input type="time" value="${startTime}" aria-label="Start time" class="routine-start">
    <input type="time" value="${endTime}" aria-label="End time" class="routine-end">
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()" aria-label="Remove commitment">✕</button>
  `;
  container.appendChild(block);
}

// --- Form Data Collection ---
function collectProfile() {
  const city = document.getElementById('city-select').value;
  if (!city) {
    alert('Please select a city.');
    return null;
  }

  // Collect routine blocks
  const routineBlocks = [];
  document.querySelectorAll('.routine-block').forEach(block => {
    const label = block.querySelector('.routine-label').value.trim();
    const start = block.querySelector('.routine-start').value;
    const end = block.querySelector('.routine-end').value;
    if (label && start && end) {
      routineBlocks.push({
        label,
        start_time: start,
        end_time: end,
        is_fixed: true,
        location: 'outdoor',
      });
    }
  });

  // Collect transport
  const transport = [...document.querySelectorAll('[name="transport"]:checked')]
    .map(cb => cb.value);

  // Collect budget
  const budget = document.querySelector('[name="budget"]:checked')?.value || 'zero';

  return {
    city,
    routine_blocks: routineBlocks,
    available_transport: transport.length > 0 ? transport : ['walk'],
    budget_band: budget,
    has_purifier: document.getElementById('has-purifier').checked,
    has_exhaust_fan: document.getElementById('has-exhaust-fan').checked,
    has_cross_ventilation: document.getElementById('has-cross-ventilation').checked,
    indoor_cooking_fuel: document.getElementById('cooking-fuel').value,
    has_children: document.getElementById('has-children').checked,
    has_elderly: document.getElementById('has-elderly').checked,
    has_respiratory_concern: document.getElementById('has-respiratory').checked,
    has_mobility_limitation: document.getElementById('has-mobility').checked,
    flexibility_minutes: parseInt(document.getElementById('flexibility').value, 10),
    additional_notes: '',
  };
}

// --- Plan Generation ---
async function createPlan(constraintChanges = []) {
  if (state.isGenerating) return;
  const revision = state.revision;
  const profile = collectProfile();
  if (!profile) return;

  state.profile = profile;
  state.isGenerating = true;

  // Switch to Today view
  switchTab('today');

  // Show loading
  const planContent = document.getElementById('plan-content');
  const todayEmpty = document.getElementById('today-empty');
  const airContext = document.getElementById('air-context');
  const airLoading = document.getElementById('air-loading');

  planContent.style.display = 'none';
  todayEmpty.style.display = 'none';
  airLoading.style.display = 'flex';
  airLoading.innerHTML = '<span class="spinner"></span><span>Fetching environmental data and generating your plan...</span>';

  // Update button state
  const btn = document.getElementById('btn-create-plan');
  btn.disabled = true;
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loading').style.display = 'inline-flex';

  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        constraint_changes: constraintChanges,
        previous_plan_fingerprint: state.currentPlan?.input_fingerprint || '',
      }),
    });

    if (res.status === 429) {
      showError('Planning is busy or the request limit has been reached. Please wait a minute and try again.');
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.detail === 'string' ? err.detail :
        res.status === 422 ? 'Check your commitments: use valid times, with each end after its start.' : `Server error (${res.status})`);
    }

    const plan = await res.json();
    if (revision !== state.revision) {
      showError('Your setup changed. Create a new plan for the updated inputs.');
      return;
    }
    state.currentPlan = plan;
    state.airContext = plan.environmental_context;

    renderAirContext(plan.environmental_context);
    renderPlan(plan);
    renderHomeActions(plan);
    renderProvenance(plan.environmental_context);
    updateHeaderStatus(plan);

  } catch (err) {
    console.error('Plan generation failed:', err);
    showError(err.message || 'Failed to generate plan. Please check your connection and try again.');
  } finally {
    state.isGenerating = false;
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';
  }
}

// --- Rendering ---

function renderAirContext(ctx) {
  if (!ctx) return;

  const card = document.getElementById('air-context');
  const loading = document.getElementById('air-loading');
  if (loading) loading.style.display = 'none';

  const categoryColor = getCategoryColor(ctx.category);
  const isStale = ctx.is_stale;
  const sourceKind = ctx.source_kind === 'model' ? '📡 Model forecast' :
    ctx.source_kind === 'fixture' ? '🧪 Fixture data' : ctx.source_kind === 'unavailable' ? 'Data unavailable' : '📍 Observation';

  let timeDisplay = 'Unknown';
  if (ctx.observed_at) {
    const d = new Date(ctx.observed_at);
    timeDisplay = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  }

  let pollutantsHtml = '';
  if (ctx.pollutants && ctx.pollutants.length > 0) {
    pollutantsHtml = '<div class="air-pollutants">';
    ctx.pollutants.forEach(p => {
      pollutantsHtml += `
        <div class="pollutant-chip">
          <span class="pollutant-name">${escapeHtml(p.name)}</span>
          <span class="pollutant-value">${p.value.toFixed(1)}</span>
          <span class="pollutant-unit">${escapeHtml(p.unit)}</span>
        </div>`;
    });
    pollutantsHtml += '</div>';
  }

  let staleHtml = '';
  if (isStale) {
    staleHtml = `<div class="stale-warning">⚠ Data is older than expected. Treat with caution.</div>`;
  }

  card.innerHTML = `
    <div class="air-header">
      <span class="air-location">${escapeHtml(ctx.location_label)}</span>
      ${ctx.category ? `<span class="air-category" style="background:${categoryColor}">${escapeHtml(ctx.category)}</span>` : ''}
    </div>
    <div class="air-meta">
      <span class="air-meta-item">${sourceKind}</span>
      ${ctx.index_system ? `<span class="air-meta-item">📏 ${escapeHtml(ctx.index_system)}: ${ctx.index_value}</span>` : ''}
      <span class="air-meta-item">🕐 ${timeDisplay}</span>
      <span class="air-meta-item">📌 ${escapeHtml(ctx.provider)}</span>
    </div>
    ${pollutantsHtml}
    ${staleHtml}
    ${ctx.source_kind === 'fixture' ? '<div class="stale-warning">🧪 This is synthetic test data, not real measurements.</div>' : ''}
  `;
}

function renderPlan(plan) {
  const planContent = document.getElementById('plan-content');
  planContent.style.display = 'block';
  document.getElementById('today-empty').style.display = 'none';

  // Context summary
  document.getElementById('plan-summary').textContent = plan.context_summary || '';

  // Mode badge
  const modeBadge = document.getElementById('mode-badge');
  const modeLabels = {
    ai: { text: '✨ AI-selected actions · source-backed guidance', cls: 'mode-ai' },
    fallback: { text: '📋 Reviewed general guidance (AI unavailable)', cls: 'mode-fallback' },
    fixture: { text: '🧪 Fixture plan', cls: 'mode-fixture' },
  };
  const mode = modeLabels[plan.generation_mode] || modeLabels.fallback;
  modeBadge.className = `mode-badge ${mode.cls}`;
  modeBadge.textContent = mode.text;

  // Actions
  const actionsList = document.getElementById('actions-list');
  actionsList.innerHTML = '';
  plan.actions.forEach((action, i) => {
    actionsList.appendChild(createActionCard(action, i + 1));
  });

  // Timeline
  renderTimeline(plan.timeline);

  // Warnings
  const warningsDiv = document.getElementById('warnings');
  if (plan.warnings && plan.warnings.length > 0) {
    warningsDiv.style.display = 'flex';
    warningsDiv.innerHTML = plan.warnings.map(w =>
      `<div class="warning-item" role="alert"><span aria-hidden="true">⚠</span> ${escapeHtml(w)}</div>`
    ).join('');
  } else {
    warningsDiv.style.display = 'none';
  }

  // Change My Day buttons
  renderConstraintButtons();
}

let actionCardSequence = 0;
function createActionCard(action, number) {
  const detailId = `detail-${++actionCardSequence}`;
  const card = document.createElement('div');
  card.className = 'action-card';
  card.id = `action-${actionCardSequence}`;

  const purposeCls = `purpose-${action.action_id.startsWith('ACT01') && parseInt(action.action_id.slice(3)) <= 3 ? 'exposure' : 'emissions'}`;

  // Determine purpose from catalogue
  let purposeLabel = 'Guidance';
  if (action.reason && action.reason.toLowerCase().includes('exposure')) purposeLabel = 'Exposure';
  else if (action.reason && action.reason.toLowerCase().includes('emission')) purposeLabel = 'Emissions';

  const evidenceLinks = (action.evidence_ids || []).map(eid => {
    const src = state.sources[eid];
    if (src) {
      return `<button type="button" class="evidence-link" onclick="showSource('${eid}')" tabindex="0" role="button"
              title="${escapeHtml(src.title)}">${eid}</button>`;
    }
    return `<span class="evidence-link">${eid}</span>`;
  }).join('');

  card.innerHTML = `
    <div class="action-card-header" onclick="toggleAction(this)" tabindex="0"
         role="button" aria-expanded="false" aria-controls="${detailId}">
      <span class="action-number">${number}</span>
      <span class="action-title">${escapeHtml(action.title)}</span>
      <span class="action-toggle" aria-hidden="true">▼</span>
    </div>
    <div class="action-details" id="${detailId}">
      ${action.time_window ? `
        <div class="action-detail-row">
          <div class="action-detail-label">When</div>
          <div class="action-detail-text">${escapeHtml(action.time_window)}</div>
        </div>` : ''}
      ${action.reason ? `
        <div class="action-detail-row">
          <div class="action-detail-label">Why this fits you</div>
          <div class="action-detail-text">${escapeHtml(action.reason)}</div>
        </div>` : ''}
      ${action.tradeoff ? `
        <div class="action-detail-row">
          <div class="action-detail-label">Tradeoff</div>
          <div class="action-detail-text">${escapeHtml(action.tradeoff)}</div>
        </div>` : ''}
      ${action.assumptions ? `
        <div class="action-detail-row">
          <div class="action-detail-label">Assumptions</div>
          <div class="action-detail-text">${escapeHtml(action.assumptions)}</div>
        </div>` : ''}
      ${evidenceLinks ? `
        <div class="action-detail-row">
          <div class="action-detail-label">Evidence</div>
          <div class="action-evidence-links">${evidenceLinks}</div>
        </div>` : ''}
    </div>
  `;

  // Keyboard support for expand/collapse
  const header = card.querySelector('.action-card-header');
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAction(header);
    }
  });

  return card;
}

function toggleAction(headerEl) {
  const card = headerEl.closest('.action-card');
  const isExpanded = card.classList.contains('expanded');
  card.classList.toggle('expanded');
  headerEl.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
}

function renderTimeline(timeline) {
  const container = document.getElementById('timeline');
  if (!timeline || timeline.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding: 1rem;">Timeline not available.</p>';
    return;
  }

  container.innerHTML = timeline.map(block => {
    const actions = (block.actions || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
    return `
      <div class="timeline-block">
        <div class="timeline-period">${escapeHtml(block.period)}</div>
        <ul class="timeline-actions">${actions}</ul>
        ${block.notes ? `<div class="timeline-notes">${escapeHtml(block.notes)}</div>` : ''}
      </div>`;
  }).join('');
}

function renderConstraintButtons() {
  const container = document.getElementById('constraint-buttons');
  if (!state.profile) return;

  const constraints = [];

  // Purifier toggle
  if (state.profile.has_purifier) {
    constraints.push({ label: 'No purifier available', icon: '🚫', change: 'purifier_off' });
  } else {
    constraints.push({ label: 'I got a purifier', icon: '✅', change: 'purifier_on' });
  }

  // Budget change
  if (state.profile.budget_band === 'zero') {
    constraints.push({ label: 'I can spend up to ₹500', icon: '💰', change: 'budget_low' });
  } else {
    constraints.push({ label: 'No extra spending', icon: '💸', change: 'budget_zero' });
  }

  // Transport
  if (state.profile.available_transport.includes('public_transit')) {
    constraints.push({ label: 'Metro unavailable', icon: '🚇', change: 'transit_off' });
  } else {
    constraints.push({ label: 'Metro available today', icon: '🚇', change: 'transit_on' });
  }

  // Fixed time
  if (state.profile.routine_blocks.length > 0) {
    const first = state.profile.routine_blocks[0];
    constraints.push({ label: `Can't change ${first.label} time`, icon: '⏰', change: 'keep_schedule' });
  }

  // Flexibility
  constraints.push({ label: 'More flexible today (+30 min)', icon: '🕐', change: 'more_flexibility' });

  container.innerHTML = constraints.map(c =>
    `<button class="constraint-btn" onclick="changeConstraint('${escapeHtml(c.change)}')" type="button">
      <span class="btn-icon">${c.icon}</span> ${escapeHtml(c.label)}
    </button>`
  ).join('');
}

async function changeConstraint(changeDescription) {
  if (state.isGenerating || !state.currentPlan) return;
  state.isGenerating = true;
  const revision = state.revision;
  state._pendingRevisedPlan = null;
  state._pendingRevisedProfile = null;
  const accept = document.getElementById('btn-accept-revised');
  accept.disabled = true;

  // Show comparison modal
  const modal = document.getElementById('compare-modal');
  const body = document.getElementById('compare-body');
  body.innerHTML = '<div style="text-align:center;padding:2rem;"><span class="spinner"></span><br>Generating revised plan...</div>';
  modal.showModal();

  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: state.profile,
        changed_constraints: [changeDescription],
        baseline_plan_id: state.currentPlan.plan_id,
      }),
    });

    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const comparison = await res.json();
    if (revision !== state.revision || !modal.open) return;
    renderComparison(comparison);
    state._pendingRevisedPlan = comparison.revised_plan;
    state._pendingRevisedProfile = comparison.revised_profile;
    state._pendingRevision = revision;
    accept.disabled = false;

  } catch (err) {
    body.innerHTML = `
      <div class="error-state">
        <h3>Comparison failed</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
  } finally {
    state.isGenerating = false;
  }
}

function renderComparison(comparison) {
  const body = document.getElementById('compare-body');

  let changesHtml = '';
  if (comparison.changes_summary) {
    changesHtml = comparison.changes_summary.map(c => {
      const cls = c.includes('Added') ? 'change-added' : c.includes('Removed') ? 'change-removed' : '';
      return `<div class="compare-change ${cls}">${escapeHtml(c)}</div>`;
    }).join('');
  }

  let preservedHtml = '';
  if (comparison.preserved_constraints && comparison.preserved_constraints.length > 0) {
    preservedHtml = comparison.preserved_constraints.map(p =>
      `<div class="compare-change change-preserved">✓ Preserved: ${escapeHtml(p)}</div>`
    ).join('');
  }

  let impactHtml = '';
  if (comparison.impact_notes && comparison.impact_notes.length > 0) {
    impactHtml = comparison.impact_notes.map(n =>
      `<p style="font-size:0.85rem;color:var(--color-text-secondary);">${escapeHtml(n)}</p>`
    ).join('');
  }

  // Build revised actions list
  const revisedActions = (comparison.revised_plan.actions || []).map((a, i) =>
    `<div style="display:flex;gap:0.5rem;align-items:center;padding:0.25rem 0;">
      <span class="action-number" style="width:22px;height:22px;font-size:0.7rem;">${i + 1}</span>
      <span style="font-size:0.85rem;">${escapeHtml(a.title)}</span>
    </div>`
  ).join('');

  body.innerHTML = `
    <div class="compare-section">
      <div class="compare-section-title">What changed</div>
      <div class="compare-changes">${changesHtml || '<p>No major action changes detected.</p>'}</div>
    </div>
    ${preservedHtml ? `
      <div class="compare-section">
        <div class="compare-section-title">Preserved commitments</div>
        <div class="compare-changes">${preservedHtml}</div>
      </div>` : ''}
    <div class="compare-section">
      <div class="compare-section-title">Revised plan actions</div>
      ${revisedActions}
      ${comparison.revised_plan.context_summary ? `<p style="font-size:0.85rem;margin-top:0.5rem;color:var(--color-text-secondary);">${escapeHtml(comparison.revised_plan.context_summary)}</p>` : ''}
    </div>
    ${impactHtml ? `
      <div class="compare-section">
        <div class="compare-section-title">Impact notes</div>
        ${impactHtml}
      </div>` : ''}
  `;
}

function acceptRevisedPlan() {
  if (state._pendingRevisedPlan && state._pendingRevision === state.revision) {
    state.profile = state._pendingRevisedProfile;
    loadSampleProfile(state.profile);
    state.currentPlan = state._pendingRevisedPlan;
    renderPlan(state._pendingRevisedPlan);
    if (state._pendingRevisedPlan.environmental_context) {
      renderAirContext(state._pendingRevisedPlan.environmental_context);
    }
    renderHomeActions(state.currentPlan);
    renderProvenance(state.currentPlan.environmental_context);
    updateHeaderStatus(state.currentPlan);
    state._pendingRevisedPlan = null;
  }
  document.getElementById('compare-modal').close();
}

// --- Home Actions ---
function renderHomeActions(plan) {
  const container = document.getElementById('home-actions');
  if (!plan || !plan.actions) {
    container.innerHTML = '<div class="empty-state"><p>Create a plan first to see home-specific recommendations.</p></div>';
    return;
  }

  // Filter to home/indoor-relevant actions
  const homeActions = plan.actions.filter(a => {
    const id = a.action_id;
    // Indoor-focused action IDs
    return ['ACT001', 'ACT002', 'ACT005', 'ACT006', 'ACT008', 'ACT011', 'ACT012', 'ACT014'].includes(id);
  });

  if (homeActions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No specific home actions in your current plan. Your plan focuses on outdoor and transport adjustments.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  homeActions.forEach((action, i) => {
    container.appendChild(createActionCard(action, i + 1));
  });
}

// --- Sources ---
function renderSources() {
  const container = document.getElementById('sources-list');
  const sourceIds = Object.keys(state.sources);

  if (sourceIds.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No sources loaded.</p></div>';
    return;
  }

  container.innerHTML = sourceIds.map(id => {
    const s = state.sources[id];
    return `
      <div class="source-card" id="source-${id}">
        <div>
          <span class="source-id">${escapeHtml(id)}</span>
          <span class="source-title">${escapeHtml(s.title)}</span>
        </div>
        <div class="source-org">${escapeHtml(s.organization)}</div>
        <div class="source-claim">${escapeHtml(s.supported_claim)}</div>
        ${s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="source-link">${escapeHtml(s.url)}</a>` : ''}
        ${s.limitations ? `<div class="source-limitations">${escapeHtml(s.limitations)}</div>` : ''}
      </div>`;
  }).join('');
}

function renderProvenance(ctx) {
  if (!ctx) return;
  const card = document.getElementById('env-provenance');
  card.style.display = 'block';

  let timeDisplay = 'Unknown';
  if (ctx.observed_at) {
    timeDisplay = new Date(ctx.observed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }

  card.innerHTML = `
    <h3 class="subsection-title" style="margin-top:0;">Environmental Data Provenance</h3>
    <div class="provenance-row">
      <span class="provenance-label">Provider</span>
      <span class="provenance-value">${escapeHtml(ctx.provider)}</span>
    </div>
    <div class="provenance-row">
      <span class="provenance-label">Data type</span>
      <span class="provenance-value">${ctx.source_kind === 'model' ? 'Model forecast (not station observation)' : ctx.source_kind === 'fixture' ? 'Synthetic fixture data' : ctx.source_kind === 'unavailable' ? 'Unavailable' : 'Observation'}</span>
    </div>
    ${ctx.index_system ? `
    <div class="provenance-row">
      <span class="provenance-label">Index system</span>
      <span class="provenance-value">${escapeHtml(ctx.index_system)} (${ctx.index_value})</span>
    </div>` : ''}
    <div class="provenance-row">
      <span class="provenance-label">Data time</span>
      <span class="provenance-value">${timeDisplay}</span>
    </div>
    <div class="provenance-row">
      <span class="provenance-label">Location</span>
      <span class="provenance-value">${escapeHtml(ctx.location_label)} (${ctx.latitude.toFixed(2)}, ${ctx.longitude.toFixed(2)})</span>
    </div>
    ${ctx.spatial_resolution_km ? `
    <div class="provenance-row">
      <span class="provenance-label">Spatial resolution</span>
      <span class="provenance-value">~${ctx.spatial_resolution_km} km (regional, not street-level)</span>
    </div>` : ''}
    <div class="provenance-row">
      <span class="provenance-label">Attribution</span>
      <span class="provenance-value">${escapeHtml(ctx.attribution)}</span>
    </div>
    ${ctx.is_stale ? `
    <div class="provenance-row">
      <span class="provenance-label">Freshness</span>
      <span class="provenance-value" style="color:var(--color-warning);">⚠ Stale — older than expected</span>
    </div>` : ''}
  `;
}

function showSource(sourceId) {
  switchTab('sources');
  setTimeout(() => {
    const el = document.getElementById(`source-${sourceId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 2px var(--color-primary-lighter)';
      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
    }
  }, 100);
}

function updateHeaderStatus(plan) {
  const status = document.getElementById('header-status');
  if (!plan) return;
  const mode = plan.generation_mode === 'ai' ? 'AI plan' :
    plan.generation_mode === 'fallback' ? 'Fallback guidance' : 'Fixture';
  const city = plan.environmental_context?.location_label || '';
  status.textContent = `${city} • ${mode}${plan.model_id ? ` • ${plan.model_id}` : ''}`;
}

// --- Error Display ---
function showError(message) {
  const planContent = document.getElementById('plan-content');
  const todayEmpty = document.getElementById('today-empty');
  const airLoading = document.getElementById('air-loading');

  airLoading.style.display = 'none';
  planContent.style.display = 'none';
  todayEmpty.style.display = 'none';

  const airContext = document.getElementById('air-context');
  airContext.innerHTML = `
    <div class="error-state">
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-secondary" onclick="switchTab('setup')" style="margin-top:0.5rem;">Back to setup</button>
    </div>`;
}

// --- Utility ---
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getCategoryColor(category) {
  if (!category) return 'var(--color-text-tertiary)';
  const cat = category.toLowerCase();
  if (cat.includes('good')) return 'var(--color-aq-good)';
  if (cat.includes('fair')) return 'var(--color-aq-fair)';
  if (cat.includes('moderate')) return 'var(--color-aq-moderate)';
  if (cat.includes('poor') && !cat.includes('very') && !cat.includes('extreme')) return 'var(--color-aq-poor)';
  if (cat.includes('very poor')) return 'var(--color-aq-very-poor)';
  if (cat.includes('extreme') || cat.includes('hazard') || cat.includes('severe')) return 'var(--color-aq-extreme)';
  return 'var(--color-text-secondary)';
}
