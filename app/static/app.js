// Coordinates requests, household state, and navigation between Saans views.
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

document.addEventListener(
  'DOMContentLoaded',
  /**
   * Load form options and evidence sources before enabling the interface.
   * @returns {Promise<void>}
   */ async () => {
    await Promise.all([loadCities(), loadSources()]);
    setupEventListeners();
    setupFlexibilitySlider();
    updateSampleBannerForMode();
  },
);

/**
 * Populate the city selector with supported locations from the API.
 * @returns {Promise<void>}
 */
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

/**
 * Index available evidence by source ID and refresh the catalogue view.
 * @returns {Promise<void>}
 */
async function loadSources() {
  try {
    const sources = await requestJson('/api/sources');
    for (const source of sources) state.sources[source.id] = source;
  } catch (error) {
    console.error('Failed to load sources:', error);
  }
  renderSources(state.sources);
}

/**
 * Apply a known sample and mark earlier planning requests as out of date.
 * @param {string} name Sample profile key from the button's data attribute.
 * @returns {void}
 */
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

/**
 * Route a click to the closest element with a recognized delegated action.
 * @param {MouseEvent} event Click received by the document.
 * @returns {void}
 */
function handleAction(event) {
  const el = event.target.closest('[data-action]');
  const action = el && Object.hasOwn(ACTIONS, el.dataset.action) && ACTIONS[el.dataset.action];
  if (!action) return;
  if (el.tagName === 'A') event.preventDefault();
  action(el);
}

/**
 * Bind navigation, form revision tracking, and plan submission handlers.
 * @returns {void}
 */
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
  document.querySelector('.tab-nav').addEventListener(
    'keydown',
    /**
     * Move focus and selection within the tab list for navigation keys.
     * @param {KeyboardEvent} e Key press received by the tab list.
     * @returns {void}
     */ (e) => {
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
    },
  );
}

/**
 * Explain the configured environmental data mode beside the sample profiles.
 * @returns {Promise<void>}
 */
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

/**
 * Select a tab, show its panel, and optionally move keyboard focus to it.
 * @param {string} tabName Tab key shared by the tab button and its panel.
 * @param {boolean} [focus] Whether to focus the selected tab button.
 * @returns {void}
 */
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

/**
 * Store the accepted profile and plan, then refresh all plan-dependent views.
 * @param {import('./profile.js').HouseholdProfile} profile Inputs associated with the plan.
 * @param {import('./views.js').Plan} plan Plan returned by the API.
 * @returns {void}
 */
function presentPlan(profile, plan) {
  state.profile = profile;
  state.currentPlan = plan;
  renderAirContext(plan.environmental_context);
  renderPlan(plan, profile, state.sources);
  renderHomeActions(plan, state.sources);
  renderProvenance(plan.environmental_context);
  updateHeaderStatus(plan);
}

/**
 * Coordinate the plan button, busy indicator, and result visibility during generation.
 * @param {boolean} loading Whether a plan request is in progress.
 * @returns {void}
 */
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

/**
 * Translate rate-limit and structured validation responses into recovery guidance.
 * @param {Error} error Failure raised while requesting or presenting a plan.
 * @returns {string} Specific guidance or the available error message.
 */
function planErrorMessage(error) {
  if (error instanceof RequestError && error.status === 429) {
    return 'Planning is busy or the request limit has been reached. Please wait a minute and try again.';
  }
  if (error instanceof RequestError && error.status === 422 && typeof error.detail !== 'string') {
    return 'Check your commitments: use valid times, with each end after its start.';
  }
  return error.message || 'Failed to generate plan. Please check your connection and try again.';
}

/**
 * Request a plan for the current setup and display it only if that setup is still current.
 * @returns {Promise<void>}
 */
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

/**
 * Compare one constraint change with the accepted plan and offer the current revision for review.
 * @param {string} change Constraint change key exposed by a comparison button.
 * @returns {Promise<void>}
 */
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

/**
 * Apply a pending revision only while it still matches the setup used for comparison.
 * @returns {void}
 */
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

/**
 * Open the source catalogue and focus, scroll to, and highlight the selected entry.
 * @param {string} sourceId Evidence ID used to locate the source card.
 * @returns {void}
 */
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
