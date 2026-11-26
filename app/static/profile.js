import { actionButton, node } from './dom.js';

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

export function setupFlexibilitySlider() {
  const slider = document.getElementById('flexibility');
  const output = document.getElementById('flexibility-value');
  if (slider && output) {
    slider.addEventListener('input', () => {
      output.textContent = `${slider.value} min`;
    });
  }
}

export function populateProfile(sample) {
  // Set city
  document.getElementById('city-select').value = sample.city;

  // Set routine blocks
  const container = document.getElementById('routine-blocks');
  container.replaceChildren();
  sample.routine_blocks.forEach((block) => {
    addRoutineBlock(block.label, block.start_time, block.end_time);
  });

  // Set transport
  document.querySelectorAll('[name="transport"]').forEach((cb) => {
    cb.checked = sample.available_transport.includes(cb.value);
  });

  // Set budget
  document.querySelectorAll('[name="budget"]').forEach((r) => {
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

// --- Form Data Collection ---
export function collectProfile() {
  const city = document.getElementById('city-select').value;
  if (!city) {
    alert('Please select a city.');
    return null;
  }

  // Collect routine blocks
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

  // Collect transport
  const transport = [...document.querySelectorAll('[name="transport"]:checked')].map(
    (cb) => cb.value,
  );

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
