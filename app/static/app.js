import { RequestError, requestJson } from './api.js';
import { errorMessage, node } from './dom.js';
import {
  addRoutineBlock,
  collectProfile,
  populateProfile,
  SAMPLE_PROFILES,
  setupFlexibilitySlider,
} from './profile.js';
import {
  renderAirContext,
  renderComparison,
  renderHomeActions,
  renderPlan,
  renderProvenance,
  renderSources,
  showError,
  toggleAction,
  updateHeaderStatus,
} from './views.js';

const state = {
  profile: null,
  currentPlan: null,
  pendingComparison: null,
  sources: Object.create(null),
  isGenerating: false,
  revision: 0,
};

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCities(), loadSources()]);
  setupEventListeners();
  setupFlexibilitySlider();
  updateSampleBannerForMode();
});

async function loadCities() {
  try {
    const cities = await requestJson('/api/cities');
    const select = document.getElementById('city-select');
    for (const city of cities) {
      const option = node('option', '', city.label);
      option.value = city.key;
      select.append(option);
    }
  } catch (error) {
    console.error('Failed to load cities:', error);
  }
}

async function loadSources() {
  try {
    const sources = await requestJson('/api/sources');
    for (const source of sources) state.sources[source.id] = source;
  } catch (error) {
    console.error('Failed to load sources:', error);
  }
  renderSources(state.sources);
}

function loadSampleProfile(name) {
  if (!Object.hasOwn(SAMPLE_PROFILES, name)) return;
  populateProfile(SAMPLE_PROFILES[name]);
  state.revision++;
}

// Delegated UI actions: markup carries data-action attributes instead of inline
// handlers, so the page can run under a strict Content-Security-Policy.
const ACTIONS = {
  sample: (el) => loadSampleProfile(el.dataset.profile),
  'add-routine': () => addRoutineBlock(),
  'remove-routine': (el) => {
    el.closest('.routine-block')?.remove();
    state.revision++;
  },
  'switch-tab': (el) => switchTab(el.dataset.tab, true),
  'close-compare': () => document.getElementById('compare-modal').close(),
  'accept-revised': () => acceptRevisedPlan(),
  'toggle-action': (el) => toggleAction(el),
  'show-source': (el) => showSource(el.dataset.source),
  'change-constraint': (el) => changeConstraint(el.dataset.change),
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
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('setup-form').addEventListener('input', () => {
    state.revision++;
  });

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

async function updateSampleBannerForMode() {
  const note = document.getElementById('sample-note');
  if (!note) return;
  try {
    const health = await requestJson('/health');
    const detail =
      health.data_mode === 'fixture'
        ? 'Synthetic environmental test data is configured. Check the returned plan for its source and time.'
        : 'Live environmental data is requested when you create a plan. ' +
          'The result shows its availability and freshness.';
    note.textContent = 'Sample profile data — not real people. ' + detail;
  } catch {
    // The static banner is useful when health is unavailable.
  }
}

// --- Tab Switching ---
function switchTab(tabName, focus = false) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach((t) => {
    const isActive = t.dataset.tab === tabName;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.tabIndex = isActive ? 0 : -1;
  });

  // Update views
  document.querySelectorAll('.view').forEach((v) => {
    const isActive = v.id === `view-${tabName}`;
    v.classList.toggle('active', isActive);
    v.hidden = !isActive;
  });
  if (focus) document.getElementById('tab-' + tabName)?.focus();
}

function presentPlan(profile, plan) {
  state.profile = profile;
  state.currentPlan = plan;
  renderAirContext(plan.environmental_context);
  renderPlan(plan, profile, state.sources);
  renderHomeActions(plan, state.sources);
  renderProvenance(plan.environmental_context);
  updateHeaderStatus(plan);
}

function setPlanLoading(loading) {
  const button = document.getElementById('btn-create-plan');
  button.disabled = loading;
  button.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
  button.querySelector('.btn-loading').style.display = loading ? 'inline-flex' : 'none';
  const indicator = document.getElementById('air-loading');
  indicator.style.display = loading ? 'flex' : 'none';
  if (!loading) return;
  document.getElementById('plan-content').style.display = 'none';
  document.getElementById('today-empty').style.display = 'none';
  indicator.replaceChildren(
    node('span', 'spinner'),
    node('span', '', 'Fetching environmental data and generating your plan...'),
  );
}

function planErrorMessage(error) {
  if (error instanceof RequestError && error.status === 429) {
    return 'Planning is busy or the request limit has been reached. Please wait a minute and try again.';
  }
  if (error instanceof RequestError && error.status === 422 && typeof error.detail !== 'string') {
    return 'Check your commitments: use valid times, with each end after its start.';
  }
  return error.message || 'Failed to generate plan. Please check your connection and try again.';
}

async function createPlan() {
  if (state.isGenerating) return;
  const profile = collectProfile();
  if (!profile) return;

  const revision = state.revision;
  state.isGenerating = true;
  switchTab('today', true);
  setPlanLoading(true);
  try {
    const plan = await requestJson('/api/plan', { profile });
    if (revision !== state.revision) {
      showError('Your setup changed. Create a new plan for the updated inputs.');
      return;
    }
    presentPlan(profile, plan);
  } catch (error) {
    showError(planErrorMessage(error));
  } finally {
    state.isGenerating = false;
    setPlanLoading(false);
  }
}

async function changeConstraint(change) {
  if (state.isGenerating || !state.currentPlan) return;
  const revision = state.revision;
  state.isGenerating = true;
  state.pendingComparison = null;

  const modal = document.getElementById('compare-modal');
  const body = document.getElementById('compare-body');
  const accept = document.getElementById('btn-accept-revised');
  accept.disabled = true;
  const loading = node(
    'div',
    'compare-loading',
    node('span', 'spinner'),
    node('br'),
    'Generating revised plan...',
  );
  loading.setAttribute('role', 'status');
  body.replaceChildren(loading);
  modal.showModal();

  try {
    const comparison = await requestJson('/api/compare', {
      profile: state.profile,
      changed_constraints: [change],
      baseline_plan_id: state.currentPlan.plan_id,
    });
    if (!modal.open || revision !== state.revision) return;
    renderComparison(comparison);
    state.pendingComparison = {
      plan: comparison.revised_plan,
      profile: comparison.revised_profile,
      revision,
    };
    accept.disabled = false;
  } catch (error) {
    if (modal.open) body.replaceChildren(errorMessage('Comparison failed', error.message));
  } finally {
    state.isGenerating = false;
  }
}

function acceptRevisedPlan() {
  const pending = state.pendingComparison;
  state.pendingComparison = null;
  document.getElementById('compare-modal').close();
  if (!pending || pending.revision !== state.revision) return;
  populateProfile(pending.profile);
  state.revision++;
  presentPlan(pending.profile, pending.plan);
  document.getElementById('tab-today').focus();
}

function showSource(sourceId) {
  switchTab('sources');
  setTimeout(() => {
    const el = document.getElementById(`source-${sourceId}`);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'center' });
      el.style.boxShadow = '0 0 0 2px var(--color-primary-lighter)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 2000);
    }
  }, 100);
}
