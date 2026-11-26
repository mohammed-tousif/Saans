// Renders air readings, plan results, comparisons, and their evidence in the browser.
import { actionButton, emptyMessage, errorMessage, node, safeUrl } from './dom.js';

/**
 * @typedef {{name: string, value: number, unit: string}} Pollutant
 * One reported pollutant concentration.
 */

/**
 * @typedef {object} AirContext
 * @property {string} provider Name of the data provider.
 * @property {string} source_kind Provider data type.
 * @property {string} location_label Display name for the location.
 * @property {number} latitude Latitude in degrees.
 * @property {number} longitude Longitude in degrees.
 * @property {number|null} spatial_resolution_km Approximate resolution, when supplied.
 * @property {string|null} observed_at Timestamp, when supplied.
 * @property {string|null} index_system Name of the air quality index, when available.
 * @property {number|null} index_value Air quality index reading, when available.
 * @property {string|null} category Display category, when available.
 * @property {Pollutant[]} pollutants Reported pollutant concentrations.
 * @property {boolean} is_stale Whether the data are older than expected.
 * @property {string} attribution Provider attribution text.
 */

/**
 * @typedef {object} PlanAction
 * @property {string} action_id Action catalogue ID.
 * @property {string} title Display title.
 * @property {string} time_window Suggested time for the action.
 * @property {string} reason Reason the action fits the household.
 * @property {string} tradeoff Cost or compromise to consider.
 * @property {string} assumptions Conditions behind the recommendation.
 * @property {string[]} evidence_ids IDs of sources supporting the action.
 */

/**
 * @typedef {{period: string, actions?: string[], notes?: string}} TimelineBlock
 * A displayed schedule period and its action text.
 */

/**
 * @typedef {object} Plan
 * @property {string} plan_id ID of the server-side plan snapshot.
 * @property {PlanAction[]} actions Recommended actions in display order.
 * @property {TimelineBlock[]} timeline Actions organized by time period.
 * @property {string} context_summary Overview of the recommendations.
 * @property {string[]} warnings Constraints or uncertainties to highlight.
 * @property {'ai'|'fallback'|'fixture'} generation_mode Method used to generate the plan.
 * @property {string|null} model_id Model label when the plan used a model.
 * @property {AirContext|null} environmental_context Data used during planning.
 */

/**
 * @typedef {object} Comparison
 * @property {Plan} revised_plan Plan calculated under the changed constraints.
 * @property {import('./profile.js').HouseholdProfile} revised_profile Inputs used for the revised plan.
 * @property {string[]} changes_summary Ordered action changes.
 * @property {string[]} preserved_constraints Constraints that still apply.
 * @property {string[]} impact_notes Qualitative effects of the changed plan.
 */

/**
 * @typedef {object} Source
 * @property {string} id Evidence ID referenced by actions.
 * @property {string} title Source title.
 * @property {string} organization Publishing organization.
 * @property {string} supported_claim Claim backed by the source.
 * @property {string} url Source URL, subject to validation before linking.
 * @property {string} limitations Caveats about how the evidence applies.
 */

/**
 * Show the current air reading, its provenance summary, and any freshness warnings.
 * @param {AirContext} ctx Environmental data used to generate the plan.
 * @returns {void}
 */
export function renderAirContext(ctx) {
  const card = document.getElementById('air-context');
  const loading = document.getElementById('air-loading');
  if (loading) loading.style.display = 'none';

  const sourceKind =
    {
      model: 'Model forecast',
      fixture: 'Fixture data',
      unavailable: 'Data unavailable',
    }[ctx.source_kind] || 'Observation';
  const time = ctx.observed_at
    ? new Date(ctx.observed_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Unknown';
  const header = node('div', 'air-header', node('span', 'air-location', ctx.location_label));
  if (ctx.category) {
    header.append(node('span', 'air-category ' + getCategoryClass(ctx.category), ctx.category));
  }
  const reading = node(
    'div',
    'air-reading',
    node('strong', '', ctx.index_value == null ? '—' : Number(ctx.index_value).toFixed(0)),
    node(
      'span',
      '',
      ctx.index_system || 'Index unavailable',
      node('small', '', sourceKind + ' · ' + time),
    ),
  );
  const metadata = [sourceKind];
  if (ctx.index_system) metadata.push(ctx.index_system + ': ' + (ctx.index_value ?? '—'));
  metadata.push(time, ctx.provider);
  card.replaceChildren(
    node('p', 'eyebrow', 'THE AIR AROUND YOU'),
    header,
    reading,
    node('div', 'air-meta', ...metadata.map((value) => node('span', 'air-meta-item', value))),
  );
  if (ctx.pollutants?.length) card.append(renderPollutants(ctx.pollutants));
  card.append(...airNotices(ctx));
}

/**
 * Build concentration chips with names, values rounded to one decimal, and units.
 * @param {Pollutant[]} pollutants Concentrations in provider order.
 * @returns {HTMLDivElement} Container for the concentration chips.
 */
function renderPollutants(pollutants) {
  return node(
    'div',
    'air-pollutants',
    ...pollutants.map((pollutant) =>
      node(
        'div',
        'pollutant-chip',
        node('span', 'pollutant-name', pollutant.name),
        node('span', 'pollutant-value', Number(pollutant.value).toFixed(1)),
        node('span', 'pollutant-unit', pollutant.unit),
      ),
    ),
  );
}

/**
 * Build notices for stale data and synthetic fixtures when applicable.
 * @param {AirContext} context Data whose freshness and source are checked.
 * @returns {HTMLDivElement[]} Notice elements in display order.
 */
function airNotices(context) {
  const notices = [];
  if (context.is_stale) {
    notices.push(node('div', 'stale-warning', 'Data is older than expected. Treat with caution.'));
  }
  if (context.source_kind === 'fixture') {
    notices.push(
      node('div', 'stale-warning', 'This is synthetic test data, not real measurements.'),
    );
  }
  return notices;
}

/**
 * Update the plan summary, action cards, timeline, warnings, and comparison options.
 * @param {Plan} plan Plan returned by the API.
 * @param {import('./profile.js').HouseholdProfile} profile Inputs used by the plan.
 * @param {Record<string, Source>} sources Evidence records indexed by ID.
 * @returns {void}
 */
export function renderPlan(plan, profile, sources) {
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
    actionsList.appendChild(createActionCard(action, i + 1, sources));
  });

  // Timeline
  renderTimeline(plan.timeline);

  // Warnings
  const warningsDiv = document.getElementById('warnings');
  if (plan.warnings && plan.warnings.length > 0) {
    warningsDiv.style.display = 'flex';
    warningsDiv.replaceChildren(
      ...plan.warnings.map((warning) => {
        const icon = node('span', '', '⚠');
        icon.setAttribute('aria-hidden', 'true');
        const item = node('div', 'warning-item', icon, ' ', warning);
        item.setAttribute('role', 'alert');
        return item;
      }),
    );
  } else {
    warningsDiv.style.display = 'none';
  }

  // Change My Day buttons
  renderConstraintButtons(profile);
}

let actionCardSequence = 0;

/**
 * Build an expandable action card with unique control IDs and links to known evidence.
 * @param {PlanAction} action Recommendation to display.
 * @param {number} number One-based position shown in the card header.
 * @param {Record<string, Source>} sources Evidence records indexed by ID.
 * @returns {HTMLDivElement} Card with collapsed details.
 */
function createActionCard(action, number, sources) {
  const sequence = ++actionCardSequence;
  const card = node('div', 'action-card');
  card.id = 'action-' + sequence;
  const details = node('div', 'action-details');
  details.id = 'detail-' + sequence;
  const arrow = node('span', 'action-toggle', '▼');
  arrow.setAttribute('aria-hidden', 'true');
  const header = actionButton(
    'action-card-header',
    'toggle-action',
    node('span', 'action-number', number),
    node('span', 'action-title', action.title),
    arrow,
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
    const evidence = node(
      'div',
      'action-evidence-links',
      ...action.evidence_ids.map((id) => {
        const source = sources[id];
        if (!source) return node('span', 'evidence-link', id);
        const button = actionButton('evidence-link', 'show-source', id);
        button.dataset.source = id;
        button.title = source.title;
        return button;
      }),
    );
    details.append(actionDetail('Evidence', evidence));
  }
  card.append(header, details);
  return card;
}

/**
 * Pair an action detail heading with its content element.
 * @param {string} label Heading for the detail row.
 * @param {HTMLElement} content Prepared detail content.
 * @returns {HTMLDivElement} Labeled detail row.
 */
function actionDetail(label, content) {
  return node('div', 'action-detail-row', node('div', 'action-detail-label', label), content);
}

/**
 * Toggle a card's details and synchronize its accessible expanded state.
 * @param {HTMLButtonElement} headerEl Card button controlling the details.
 * @returns {void}
 */
export function toggleAction(headerEl) {
  const card = headerEl.closest('.action-card');
  const isExpanded = card.classList.contains('expanded');
  card.classList.toggle('expanded');
  headerEl.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
}

/**
 * Render the schedule in display order, or show the empty timeline message.
 * @param {TimelineBlock[]} [timeline] Scheduled periods and their recommendations.
 * @returns {void}
 */
function renderTimeline(timeline) {
  const container = document.getElementById('timeline');
  if (!timeline?.length) {
    container.replaceChildren(node('p', 'empty-state timeline-empty', 'Timeline not available.'));
    return;
  }
  container.replaceChildren(
    ...timeline.map((block) => {
      const row = node(
        'div',
        'timeline-block',
        node('div', 'timeline-period', block.period),
        node(
          'ul',
          'timeline-actions',
          ...(block.actions || []).map((text) => node('li', '', text)),
        ),
      );
      if (block.notes) row.append(node('div', 'timeline-notes', block.notes));
      return row;
    }),
  );
}

/**
 * Offer comparison controls that reflect the household's current constraints.
 * @param {import('./profile.js').HouseholdProfile} profile Current household settings.
 * @returns {void}
 */
function renderConstraintButtons(profile) {
  const container = document.getElementById('constraint-buttons');

  const constraints = [];

  // Purifier toggle
  if (profile.has_purifier) {
    constraints.push({ label: 'No purifier available', icon: '−', change: 'purifier_off' });
  } else {
    constraints.push({ label: 'I got a purifier', icon: '+', change: 'purifier_on' });
  }

  // Budget change
  if (profile.budget_band === 'zero') {
    constraints.push({ label: 'I can spend up to ₹500', icon: '+', change: 'budget_low' });
  } else {
    constraints.push({ label: 'No extra spending', icon: '−', change: 'budget_zero' });
  }

  // Transport
  if (profile.available_transport.includes('public_transit')) {
    constraints.push({ label: 'Metro unavailable', icon: '↔', change: 'transit_off' });
  } else {
    constraints.push({ label: 'Metro available today', icon: '↔', change: 'transit_on' });
  }

  // Fixed time
  if (profile.routine_blocks.length > 0) {
    const first = profile.routine_blocks[0];
    constraints.push({
      label: `Can't change ${first.label} time`,
      icon: '◷',
      change: 'keep_schedule',
    });
  }

  // Flexibility
  constraints.push({
    label: 'More flexible today (+30 min)',
    icon: '+',
    change: 'more_flexibility',
  });

  container.replaceChildren(
    ...constraints.map((constraint) => {
      const icon = node('span', 'btn-icon', constraint.icon);
      icon.setAttribute('aria-hidden', 'true');
      const button = actionButton(
        'constraint-btn',
        'change-constraint',
        icon,
        ' ',
        constraint.label,
      );
      button.dataset.change = constraint.change;
      return button;
    }),
  );
}

/**
 * Show changes, preserved commitments, revised actions, and impact notes in the dialog.
 * @param {Comparison} comparison Comparison returned by the API.
 * @returns {void}
 */
export function renderComparison(comparison) {
  const { revised_plan: plan } = comparison;
  const changes = (comparison.changes_summary || []).map((text) => {
    const className = text.startsWith('Added:')
      ? 'change-added'
      : text.startsWith('Removed:')
        ? 'change-removed'
        : '';
    return node('div', 'compare-change ' + className, text);
  });
  const preserved = (comparison.preserved_constraints || []).map((text) =>
    node('div', 'compare-change change-preserved', '✓ Preserved: ' + text),
  );
  const revised = (plan.actions || []).map((action, index) =>
    node(
      'div',
      'compare-action-row',
      node('span', 'action-number action-number-sm', index + 1),
      node('span', 'compare-action-title', action.title),
    ),
  );
  if (plan.context_summary)
    revised.push(node('p', 'compare-note compare-summary', plan.context_summary));
  const notes = (comparison.impact_notes || []).map((text) => node('p', 'compare-note', text));
  const sections = [
    compareSection(
      'What changed',
      node(
        'div',
        'compare-changes',
        ...(changes.length ? changes : [node('p', '', 'No major action changes detected.')]),
      ),
    ),
  ];
  if (preserved.length)
    sections.push(
      compareSection('Preserved commitments', node('div', 'compare-changes', ...preserved)),
    );
  sections.push(compareSection('Revised plan actions', ...revised));
  if (notes.length) sections.push(compareSection('Impact notes', ...notes));
  document.getElementById('compare-body').replaceChildren(...sections);
}

/**
 * Group comparison results beneath a section heading.
 * @param {string} title Section heading.
 * @param {...HTMLElement} content Prepared result elements.
 * @returns {HTMLDivElement} Labeled comparison section.
 */
function compareSection(title, ...content) {
  return node('div', 'compare-section', node('div', 'compare-section-title', title), ...content);
}

/**
 * Display the subset of recommendations that applies to the home.
 * @param {Plan|null} plan Current plan, when available.
 * @param {Record<string, Source>} sources Evidence records indexed by ID.
 * @returns {void}
 */
export function renderHomeActions(plan, sources) {
  const container = document.getElementById('home-actions');
  if (!plan?.actions) {
    container.replaceChildren(
      emptyMessage('Create a plan first to see home-specific recommendations.'),
    );
    return;
  }
  const homeIds = ['ACT001', 'ACT002', 'ACT005', 'ACT006', 'ACT008', 'ACT011', 'ACT012', 'ACT014'];
  const homeActions = plan.actions.filter((action) => homeIds.includes(action.action_id));
  if (!homeActions.length) {
    container.replaceChildren(
      emptyMessage(
        'No specific home actions in your current plan. Your plan focuses on outdoor and transport adjustments.',
      ),
    );
    return;
  }
  container.replaceChildren(
    ...homeActions.map((action, index) => createActionCard(action, index + 1, sources)),
  );
}

/**
 * Show evidence records and create external links only for allowed URLs.
 * @param {Record<string, Source>} catalogue Evidence records indexed by ID.
 * @returns {void}
 */
export function renderSources(catalogue) {
  const container = document.getElementById('sources-list');
  const sources = Object.values(catalogue);
  if (!sources.length) {
    container.replaceChildren(emptyMessage('No sources loaded.'));
    return;
  }
  container.replaceChildren(
    ...sources.map((source) => {
      const card = node(
        'div',
        'source-card',
        node(
          'div',
          '',
          node('span', 'source-id', source.id),
          ' ',
          node('span', 'source-title', source.title),
        ),
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
    }),
  );
}

/**
 * Show provider, data type, timestamp, location, and applicable freshness or resolution details.
 * @param {AirContext|null} ctx Environmental data used by the current plan.
 * @returns {void}
 */
export function renderProvenance(ctx) {
  if (!ctx) return;
  const card = document.getElementById('env-provenance');
  card.style.display = 'block';
  const sourceKind =
    {
      model: 'Model forecast (not station observation)',
      fixture: 'Synthetic fixture data',
      unavailable: 'Unavailable',
    }[ctx.source_kind] || 'Observation';
  const rows = [
    ['Provider', ctx.provider],
    ['Data type', sourceKind],
  ];
  if (ctx.index_system)
    rows.push(['Index system', ctx.index_system + ' (' + (ctx.index_value ?? '—') + ')']);
  rows.push([
    'Data time',
    ctx.observed_at
      ? new Date(ctx.observed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      : 'Unknown',
  ]);
  rows.push([
    'Location',
    ctx.location_label +
      ' (' +
      Number(ctx.latitude).toFixed(2) +
      ', ' +
      Number(ctx.longitude).toFixed(2) +
      ')',
  ]);
  if (ctx.spatial_resolution_km) {
    rows.push([
      'Spatial resolution',
      '~' + ctx.spatial_resolution_km + ' km (regional, not street-level)',
    ]);
  }
  rows.push(['Attribution', ctx.attribution]);
  if (ctx.is_stale) rows.push(['Freshness', 'Stale — older than expected', ' provenance-stale']);
  card.replaceChildren(
    node('h3', 'subsection-title provenance-title', 'Environmental Data Provenance'),
    ...rows.map(([label, value, extraClass = '']) =>
      node(
        'div',
        'provenance-row',
        node('span', 'provenance-label', label),
        node('span', 'provenance-value' + extraClass, value),
      ),
    ),
  );
}

/**
 * Show the plan's location, generation mode, and available model ID in the header.
 * @param {Plan|null} plan Current plan, when available.
 * @returns {void}
 */
export function updateHeaderStatus(plan) {
  const status = document.getElementById('header-status');
  if (!plan) return;
  const mode =
    plan.generation_mode === 'ai'
      ? 'AI plan'
      : plan.generation_mode === 'fallback'
        ? 'Fallback guidance'
        : 'Fixture';
  const city = plan.environmental_context?.location_label || '';
  status.textContent = `${city} • ${mode}${plan.model_id ? ` • ${plan.model_id}` : ''}`;
}

/**
 * Replace the air card with an accessible error and a way back to setup.
 * @param {string} message Error detail to show.
 * @returns {void}
 */
export function showError(message) {
  for (const id of ['air-loading', 'plan-content', 'today-empty']) {
    document.getElementById(id).style.display = 'none';
  }
  const panel = errorMessage('Something went wrong', message);
  const back = actionButton('btn btn-secondary error-back', 'switch-tab', 'Back to setup');
  back.dataset.tab = 'setup';
  panel.append(back);
  document.getElementById('air-context').replaceChildren(panel);
}

/**
 * Map a provider's category wording to the severity colors used by the interface.
 * @param {string|null} [category] Air quality category, when available.
 * @returns {string} CSS class for the category or the unknown state.
 */
export function getCategoryClass(category) {
  if (!category) return 'aq-unknown';
  const cat = category.toLowerCase();
  if (cat.includes('extreme') || cat.includes('hazard') || cat.includes('severe'))
    return 'aq-extreme';
  if (cat.includes('very poor')) return 'aq-very-poor';
  if (cat.includes('poor')) return 'aq-poor';
  if (cat.includes('moderate')) return 'aq-moderate';
  if (cat.includes('fair')) return 'aq-fair';
  if (cat.includes('good')) return 'aq-good';
  return 'aq-unknown';
}
