const correctnessRules = {
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-dupe-keys': 'error',
  'no-fallthrough': 'error',
  'no-redeclare': 'error',
  'no-undef': 'error',
  'no-unreachable': 'error',
  'no-unused-vars': 'error',
  'prefer-const': 'error',
};

const browserGlobals = {
  alert: 'readonly',
  console: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
  window: 'readonly',
};

export default [
  {
    files: ['app/static/*.js', 'tests/frontend/*.{js,cjs}', 'playwright.config.cjs'],
    rules: correctnessRules,
  },
  {
    files: ['app/static/*.js'],
    languageOptions: { globals: browserGlobals },
    rules: { complexity: ['error', 12] },
  },
  {
    files: ['tests/frontend/*.spec.cjs'],
    languageOptions: { globals: browserGlobals },
  },
];
