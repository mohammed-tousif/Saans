// Reads and populates the household setup form and its sample profiles.
import { actionButton, node } from './dom.js';

/**
 * @typedef {object} RoutineBlock
 * @property {string} label Commitment name.
 * @property {string} start_time Local start time in HH:MM format.
 * @property {string} end_time Local end time in HH:MM format.
 * @property {boolean} is_fixed Whether the time is fixed.
 * @property {string} location Setting such as outdoor or commute.
 */

/**
 * @typedef {object} HouseholdProfile
 * @property {string} city City key from the API.
 * @property {RoutineBlock[]} routine_blocks Scheduled commitments.
 * @property {string[]} available_transport Available transport keys.
 * @property {string} budget_band Budget category.
 * @property {boolean} has_purifier Whether a purifier is available.
 * @property {boolean} has_exhaust_fan Whether an exhaust fan is available.
 * @property {boolean} has_cross_ventilation Whether cross ventilation is available.
 * @property {string} indoor_cooking_fuel Cooking fuel key.
 * @property {boolean} has_children Whether the household includes children.
 * @property {boolean} has_elderly Whether the household includes older adults.
 * @property {boolean} has_respiratory_concern Whether anyone has a respiratory concern.
 * @property {boolean} [has_mobility_limitation] Whether anyone has limited mobility.
 * @property {number} flexibility_minutes Available schedule flexibility in minutes.
 * @property {string} [additional_notes] Optional profile notes.
 */

export const SAMPLE_PROFILES = {
  parent: {
    label: 'School-run parent (Delhi, sample data)',
    city: 'delhi',
    routine_blocks: [
      {
        label: 'School drop-off',
        start_time: '08:00',
        end_time: '08:45',
        is_fixed: true,
        location: 'commute',
      },
      {
        label: 'School pick-up',
        start_time: '14:00',
        end_time: '14:45',
        is_fixed: true,
        location: 'commute',
      },
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
      {
        label: 'Work shift',
        start_time: '09:00',
        end_time: '17:00',
        is_fixed: true,
        location: 'outdoor',
      },
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

/**
 * Mirror the flexibility slider value in its minute readout when it changes.
 * @returns {void}
 */
export function setupFlexibilitySlider() {
  const slider = document.getElementById('flexibility');
  const output = document.getElementById('flexibility-value');
  if (slider && output) {
    slider.addEventListener('input', () => {
      output.textContent = `${slider.value} min`;
    });
  }
}

/**
 * Fill the setup form with a sample or revised household profile.
 * @param {HouseholdProfile} sample Profile whose fields replace the form values.
 * @returns {void}
 */
export function populateProfile(sample) {
  document.getElementById('city-select').value = sample.city;

  // Replace rows so a sample or revised profile cannot leave old commitments behind.
  const container = document.getElementById('routine-blocks');
  container.replaceChildren();
  sample.routine_blocks.forEach((block) => {
    addRoutineBlock(block.label, block.start_time, block.end_time);
  });

  document.querySelectorAll('[name="transport"]').forEach((cb) => {
    cb.checked = sample.available_transport.includes(cb.value);
  });

  document.querySelectorAll('[name="budget"]').forEach((r) => {
    r.checked = r.value === sample.budget_band;
  });

  document.getElementById('has-purifier').checked = sample.has_purifier;
  document.getElementById('has-exhaust-fan').checked = sample.has_exhaust_fan;
  document.getElementById('has-cross-ventilation').checked = sample.has_cross_ventilation;
  document.getElementById('cooking-fuel').value = sample.indoor_cooking_fuel;

  document.getElementById('has-children').checked = sample.has_children;
  document.getElementById('has-elderly').checked = sample.has_elderly;
  document.getElementById('has-respiratory').checked = sample.has_respiratory_concern;
  document.getElementById('has-mobility').checked = !!sample.has_mobility_limitation;

  // Assigning a slider value does not emit input, so update its readout as well.
  const slider = document.getElementById('flexibility');
  slider.value = sample.flexibility_minutes;
  document.getElementById('flexibility-value').textContent = `${sample.flexibility_minutes} min`;
}

/**
 * Append an editable commitment row with time fields and a remove button.
 * @param {string} [label] Initial commitment name.
 * @param {string} [startTime] Initial local start in HH:MM format.
 * @param {string} [endTime] Initial local end in HH:MM format.
 * @returns {void}
 */
export function addRoutineBlock(label = '', startTime = '09:00', endTime = '17:00') {
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

/**
 * Collect the current form values, omitting incomplete commitment rows.
 * @returns {HouseholdProfile|null} Profile for the planning API, or null after alerting for a missing city.
 */
export function collectProfile() {
  const city = document.getElementById('city-select').value;
  if (!city) {
    alert('Please select a city.');
    return null;
  }

  // An unfinished row is a draft. Send complete commitments as fixed blocks.
  const routineBlocks = [];
  document.querySelectorAll('.routine-block').forEach((block) => {
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

  // Send option keys expected by the API. An empty selection falls back to walking.
  const transport = [...document.querySelectorAll('[name="transport"]:checked')].map(
    (cb) => cb.value,
  );

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
