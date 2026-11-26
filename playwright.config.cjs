const { defineConfig } = require('@playwright/test');

const baseURL = 'http://127.0.0.1:8019';

module.exports = defineConfig({
  testDir: './tests/frontend',
  testMatch: '**/*.spec.cjs',
  workers: 1,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: 'uv run --locked uvicorn app.main:app --host 127.0.0.1 --port 8019',
    url: baseURL + '/health',
    reuseExistingServer: false,
    env: { DATA_MODE: 'fixture', GEMINI_API_KEY: '' },
  },
});
