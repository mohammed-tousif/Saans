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
  sources: Object.create(null),
  isGenerating: false,
  isSampleProfile: false,
  revision: 0,
};

// --- Sample Profiles ---
const SAMPLE_PROFILES = {
  parent: {
    label: 'School-run parent (Delhi, sample data)',
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
    label: 'Outdoor worker (Delhi, sample data)',
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
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    await loadCities();
    await loadSources();
    setupEventListeners();
    setupFlexibilitySlider();
    updateSampleBannerForMode();
  });
}

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

// Delegated UI actions: markup carries data-action attributes instead of inline
// handlers, so the page can run under a strict Content-Security-Policy.
const ACTIONS = {
  'sample': el => loadSampleProfile(el.dataset.profile),
  'add-routine': () => addRoutineBlock(),
  'remove-routine': el => { el.closest('.routine-block')?.remove(); state.revision++; },
  'switch-tab': el => switchTab(el.dataset.tab, true),
  'close-compare': () => document.getElementById('compare-modal').close(),
  'accept-revised': () => acceptRevisedPlan(),
  'toggle-action': el => toggleAction(el),
  'show-source': el => showSource(el.dataset.source),
  'change-constraint': el => changeConstraint(el.dataset.change),
};

function handleAction(event) {
  const el = event.target.closest('[data-action]');
  const action = el && Object.hasOwn(ACTIONS, el.dataset.action) && ACTIONS[el.dataset.action];
  if (!action) return;
  if (el.tagName === 'A') event.preventDefault();
  action(el);
}

function setupEventListeners() {
  document.addEventListener('click', handleAction);

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
    const destinations = {
      ArrowRight: (idx + 1) % tabs.length,
      ArrowLeft: (idx - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(destinations, e.key)) return;
    e.preventDefault();
    switchTab(tabs[destinations[e.key]].dataset.tab, true);
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
          note.textContent = 'Sample profile data — not real people. Synthetic environmental test data is configured. Check the returned plan for its data source and time.';
        } else {
          note.textContent = 'Sample profile data — not real people. Live environmental data is requested when you create a plan; availability and freshness are shown with the result.';
        }
      }
    }
  } catch (err) {
    // Silently continue; the static text is an acceptable fallback.
  }
}

// --- Tab Switching ---
function switchTab(tabName, focus = false) {
  state.currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.tab').forEach(t => {
    const isActive = t.dataset.tab === tabName;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.tabIndex = isActive ? 0 : -1;
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => {
    const isActive = v.id === `view-${tabName}`;
    v.classList.toggle('active', isActive);
    v.hidden = !isActive;
  });
  if (focus) document.getElementById('tab-' + tabName)?.focus();
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
  container.replaceChildren();
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
  const block = node('div', 'routine-block');
  const fields = [
    ['text', 'routine-label', 'Commitment name', label],
    ['time', 'routine-start', 'Start time', startTime],
    ['time', 'routine-end', 'End time', endTime],
  ];
  for (const [type, className, name, value] of fields) {
    const input = node('input', className);
    input.type = type;
    input.value = value;
    input.setAttribute('aria-label', name);
    if (type === 'text') input.placeholder = 'e.g., School drop-off';
    block.append(input);
  }
  const remove = actionButton('btn-remove', 'remove-routine', '✕');
  remove.setAttribute('aria-label', 'Remove commitment');
  block.append(remove);
  document.getElementById('routine-blocks').append(block);
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
  switchTab('today', true);

  // Show loading
  const planContent = document.getElementById('plan-content');
  const todayEmpty = document.getElementById('today-empty');
  const airContext = document.getElementById('air-context');
  const airLoading = document.getElementById('air-loading');

  planContent.style.display = 'none';
  todayEmpty.style.display = 'none';
  airLoading.style.display = 'flex';
  airLoading.replaceChildren(node('span', 'spinner'), node('span', '', 'Fetching environmental data and generating your plan...'));

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
  const card = document.getElementById('air-context');
  const loading = document.getElementById('air-loading');
  if (loading) loading.style.display = 'none';

  const sourceKind = ({
    model: 'Model forecast', fixture: 'Fixture data', unavailable: 'Data unavailable',
  })[ctx.source_kind] || 'Observation';
  const time = ctx.observed_at
    ? new Date(ctx.observed_at).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
    })
    : 'Unknown';
  const header = node('div', 'air-header', node('span', 'air-location', ctx.location_label));
  if (ctx.category) {
    header.append(node('span', 'air-category ' + getCategoryClass(ctx.category), ctx.category));
  }
  const reading = node('div', 'air-reading',
    node('strong', '', ctx.index_value == null ? '—' : Number(ctx.index_value).toFixed(0)),
    node('span', '', ctx.index_system || 'Index unavailable', node('small', '', sourceKind + ' · ' + time)),
  );
  const metadata = [sourceKind];
  if (ctx.index_system) metadata.push(ctx.index_system + ': ' + (ctx.index_value ?? '—'));
  metadata.push(time, ctx.provider);
  card.replaceChildren(node('p', 'eyebrow', 'THE AIR AROUND YOU'), header, reading,
    node('div', 'air-meta', ...metadata.map(value => node('span', 'air-meta-item', value))),
  );
  if (ctx.pollutants?.length) {
    card.append(node('div', 'air-pollutants', ...ctx.pollutants.map(pollutant =>
      node('div', 'pollutant-chip',
        node('span', 'pollutant-name', pollutant.name),
        node('span', 'pollutant-value', Number(pollutant.value).toFixed(1)),
        node('span', 'pollutant-unit', pollutant.unit),
      ),
    )));
  }
  if (ctx.is_stale) card.append(node('div', 'stale-warning', 'Data is older than expected. Treat with caution.'));
  if (ctx.source_kind === 'fixture') {
    card.append(node('div', 'stale-warning', 'This is synthetic test data, not real measurements.'));
  }
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
    ai: { text: 'AI-selected actions · source-backed guidance', cls: 'mode-ai' },
    fallback: { text: 'Reviewed general guidance (AI unavailable)', cls: 'mode-fallback' },
    fixture: { text: 'Fixture plan', cls: 'mode-fixture' },
  };
  const mode = modeLabels[plan.generation_mode] || modeLabels.fallback;
  modeBadge.className = `mode-badge ${mode.cls}`;
  modeBadge.textContent = mode.text;

  // Actions
  const actionsList = document.getElementById('actions-list');
  actionsList.replaceChildren();
  plan.actions.forEach((action, i) => {
    actionsList.appendChild(createActionCard(action, i + 1));
  });

  // Timeline
  renderTimeline(plan.timeline);

  // Warnings
  const warningsDiv = document.getElementById('warnings');
  if (plan.warnings && plan.warnings.length > 0) {
    warningsDiv.style.display = 'flex';
    warningsDiv.replaceChildren(...plan.warnings.map(warning => {
      const icon = node('span', '', '⚠');
      icon.setAttribute('aria-hidden', 'true');
      const item = node('div', 'warning-item', icon, ' ', warning);
      item.setAttribute('role', 'alert');
      return item;
    }));
  } else {
    warningsDiv.style.display = 'none';
  }

  // Change My Day buttons
  renderConstraintButtons();
}

let actionCardSequence = 0;
function createActionCard(action, number) {
  const sequence = ++actionCardSequence;
  const card = node('div', 'action-card');
  card.id = 'action-' + sequence;
  const details = node('div', 'action-details');
  details.id = 'detail-' + sequence;
  const arrow = node('span', 'action-toggle', '▼');
  arrow.setAttribute('aria-hidden', 'true');
  const header = actionButton('action-card-header', 'toggle-action',
    node('span', 'action-number', number), node('span', 'action-title', action.title), arrow,
  );
  header.setAttribute('aria-expanded', 'false');
  header.setAttribute('aria-controls', details.id);

  const rows = [
    ['When', action.time_window],
    ['Why this fits you', action.reason],
    ['Tradeoff', action.tradeoff],
    ['Assumptions', action.assumptions],
  ];
  for (const [label, value] of rows) {
    if (value) details.append(actionDetail(label, node('div', 'action-detail-text', value)));
  }
  if (action.evidence_ids?.length) {
    const evidence = node('div', 'action-evidence-links', ...action.evidence_ids.map(id => {
      const source = state.sources[id];
      if (!source) return node('span', 'evidence-link', id);
      const button = actionButton('evidence-link', 'show-source', id);
      button.dataset.source = id;
      button.title = source.title;
      return button;
    }));
    details.append(actionDetail('Evidence', evidence));
  }
  card.append(header, details);
  return card;
}

function actionDetail(label, content) {
  return node('div', 'action-detail-row', node('div', 'action-detail-label', label), content);
}

function toggleAction(headerEl) {
  const card = headerEl.closest('.action-card');
  const isExpanded = card.classList.contains('expanded');
  card.classList.toggle('expanded');
  headerEl.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
}

function renderTimeline(timeline) {
  const container = document.getElementById('timeline');
  if (!timeline?.length) {
    container.replaceChildren(node('p', 'empty-state timeline-empty', 'Timeline not available.'));
    return;
  }
  container.replaceChildren(...timeline.map(block => {
    const row = node('div', 'timeline-block',
      node('div', 'timeline-period', block.period),
      node('ul', 'timeline-actions', ...(block.actions || []).map(text => node('li', '', text))),
    );
    if (block.notes) row.append(node('div', 'timeline-notes', block.notes));
    return row;
  }));
}

function renderConstraintButtons() {
  const container = document.getElementById('constraint-buttons');
  if (!state.profile) return;

  const constraints = [];

  // Purifier toggle
  if (state.profile.has_purifier) {
    constraints.push({ label: 'No purifier available', icon: '−', change: 'purifier_off' });
  } else {
    constraints.push({ label: 'I got a purifier', icon: '+', change: 'purifier_on' });
  }

  // Budget change
  if (state.profile.budget_band === 'zero') {
    constraints.push({ label: 'I can spend up to ₹500', icon: '+', change: 'budget_low' });
  } else {
    constraints.push({ label: 'No extra spending', icon: '−', change: 'budget_zero' });
  }

  // Transport
  if (state.profile.available_transport.includes('public_transit')) {
    constraints.push({ label: 'Metro unavailable', icon: '↔', change: 'transit_off' });
  } else {
    constraints.push({ label: 'Metro available today', icon: '↔', change: 'transit_on' });
  }

  // Fixed time
  if (state.profile.routine_blocks.length > 0) {
    const first = state.profile.routine_blocks[0];
    constraints.push({ label: `Can't change ${first.label} time`, icon: '◷', change: 'keep_schedule' });
  }

  // Flexibility
  constraints.push({ label: 'More flexible today (+30 min)', icon: '+', change: 'more_flexibility' });

  container.replaceChildren(...constraints.map(constraint => {
    const icon = node('span', 'btn-icon', constraint.icon);
    icon.setAttribute('aria-hidden', 'true');
    const button = actionButton('constraint-btn', 'change-constraint', icon, ' ', constraint.label);
    button.dataset.change = constraint.change;
    return button;
  }));
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
  const loading = node('div', 'compare-loading', node('span', 'spinner'), node('br'), 'Generating revised plan...');
  loading.setAttribute('role', 'status');
  body.replaceChildren(loading);
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
    body.replaceChildren(errorMessage('Comparison failed', err.message));
  } finally {
    state.isGenerating = false;
  }
}

function renderComparison(comparison) {
  const { revised_plan: plan } = comparison;
  const changes = (comparison.changes_summary || []).map(text => {
    const className = text.startsWith('Added:') ? 'change-added'
      : text.startsWith('Removed:') ? 'change-removed' : '';
    return node('div', 'compare-change ' + className, text);
  });
  const preserved = (comparison.preserved_constraints || []).map(text =>
    node('div', 'compare-change change-preserved', '✓ Preserved: ' + text),
  );
  const revised = (plan.actions || []).map((action, index) =>
    node('div', 'compare-action-row', node('span', 'action-number action-number-sm', index + 1),
      node('span', 'compare-action-title', action.title)),
  );
  if (plan.context_summary) revised.push(node('p', 'compare-note compare-summary', plan.context_summary));
  const notes = (comparison.impact_notes || []).map(text => node('p', 'compare-note', text));
  const sections = [compareSection('What changed', node('div', 'compare-changes',
    ...(changes.length ? changes : [node('p', '', 'No major action changes detected.')]),
  ))];
  if (preserved.length) sections.push(compareSection('Preserved commitments', node('div', 'compare-changes', ...preserved)));
  sections.push(compareSection('Revised plan actions', ...revised));
  if (notes.length) sections.push(compareSection('Impact notes', ...notes));
  document.getElementById('compare-body').replaceChildren(...sections);
}

function compareSection(title, ...content) {
  return node('div', 'compare-section', node('div', 'compare-section-title', title), ...content);
}

function acceptRevisedPlan() {
  const modal = document.getElementById('compare-modal');
  modal.close();
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
    document.getElementById('tab-today').focus();
  }
}

// --- Home Actions ---
function renderHomeActions(plan) {
  const container = document.getElementById('home-actions');
  if (!plan?.actions) {
    container.replaceChildren(emptyMessage('Create a plan first to see home-specific recommendations.'));
    return;
  }
  const homeIds = ['ACT001', 'ACT002', 'ACT005', 'ACT006', 'ACT008', 'ACT011', 'ACT012', 'ACT014'];
  const homeActions = plan.actions.filter(action => homeIds.includes(action.action_id));
  if (!homeActions.length) {
    container.replaceChildren(emptyMessage('No specific home actions in your current plan. Your plan focuses on outdoor and transport adjustments.'));
    return;
  }
  container.replaceChildren(...homeActions.map((action, index) => createActionCard(action, index + 1)));
}

// --- Sources ---
function renderSources() {
  const container = document.getElementById('sources-list');
  const sources = Object.values(state.sources);
  if (!sources.length) {
    container.replaceChildren(emptyMessage('No sources loaded.'));
    return;
  }
  container.replaceChildren(...sources.map(source => {
    const card = node('div', 'source-card',
      node('div', '', node('span', 'source-id', source.id), ' ', node('span', 'source-title', source.title)),
      node('div', 'source-org', source.organization),
      node('div', 'source-claim', source.supported_claim),
    );
    card.id = 'source-' + source.id;
    card.tabIndex = -1;
    const url = safeUrl(source.url);
    if (url) {
      const link = node('a', 'source-link', source.url);
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      card.append(link);
    }
    if (source.limitations) card.append(node('div', 'source-limitations', source.limitations));
    return card;
  }));
}

function renderProvenance(ctx) {
  if (!ctx) return;
  const card = document.getElementById('env-provenance');
  card.style.display = 'block';
  const sourceKind = ({
    model: 'Model forecast (not station observation)', fixture: 'Synthetic fixture data', unavailable: 'Unavailable',
  })[ctx.source_kind] || 'Observation';
  const rows = [['Provider', ctx.provider], ['Data type', sourceKind]];
  if (ctx.index_system) rows.push(['Index system', ctx.index_system + ' (' + (ctx.index_value ?? '—') + ')']);
  rows.push(['Data time', ctx.observed_at
    ? new Date(ctx.observed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown']);
  rows.push(['Location', ctx.location_label + ' (' + Number(ctx.latitude).toFixed(2) + ', ' + Number(ctx.longitude).toFixed(2) + ')']);
  if (ctx.spatial_resolution_km) {
    rows.push(['Spatial resolution', '~' + ctx.spatial_resolution_km + ' km (regional, not street-level)']);
  }
  rows.push(['Attribution', ctx.attribution]);
  if (ctx.is_stale) rows.push(['Freshness', 'Stale — older than expected', ' provenance-stale']);
  card.replaceChildren(node('h3', 'subsection-title provenance-title', 'Environmental Data Provenance'),
    ...rows.map(([label, value, extraClass = '']) => node('div', 'provenance-row',
      node('span', 'provenance-label', label), node('span', 'provenance-value' + extraClass, value),
    )),
  );
}

function showSource(sourceId) {
  switchTab('sources');
  setTimeout(() => {
    const el = document.getElementById(`source-${sourceId}`);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'center' });
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
  for (const id of ['air-loading', 'plan-content', 'today-empty']) {
    document.getElementById(id).style.display = 'none';
  }
  const panel = errorMessage('Something went wrong', message);
  const back = actionButton('btn btn-secondary error-back', 'switch-tab', 'Back to setup');
  back.dataset.tab = 'setup';
  panel.append(back);
  document.getElementById('air-context').replaceChildren(panel);
}

// --- Utility ---
// Element names and attributes are chosen by the UI. Values are appended as text.
function node(tag, className = '', ...children) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  for (const child of children) {
    if (child != null) element.append(child);
  }
  return element;
}

function actionButton(className, action, ...children) {
  const button = node('button', className, ...children);
  button.type = 'button';
  button.dataset.action = action;
  return button;
}

function emptyMessage(message) {
  return node('div', 'empty-state', node('p', '', message));
}

function errorMessage(title, message) {
  const alert = node('div', 'error-state', node('h3', '', title), node('p', '', message));
  alert.setAttribute('role', 'alert');
  return alert;
}

// Only http(s) links from the source catalogue are rendered as clickable links.
function safeUrl(url) {
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function getCategoryClass(category) {
  if (!category) return 'aq-unknown';
  const cat = category.toLowerCase();
  if (cat.includes('extreme') || cat.includes('hazard') || cat.includes('severe')) return 'aq-extreme';
  if (cat.includes('very poor')) return 'aq-very-poor';
  if (cat.includes('poor')) return 'aq-poor';
  if (cat.includes('moderate')) return 'aq-moderate';
  if (cat.includes('fair')) return 'aq-fair';
  if (cat.includes('good')) return 'aq-good';
  return 'aq-unknown';
}

// Exposed for Node's built-in test runner; ignored in the browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { safeUrl, getCategoryClass };
}
