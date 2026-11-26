// Frontend unit tests for pure helpers in app/static/app.js.
// Run with: node --test tests/frontend/app.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { safeUrl, getCategoryClass } = require(
  path.join(__dirname, '..', '..', 'app', 'static', 'app.js'),
);

test('safeUrl allows only http(s) links', () => {
  assert.equal(safeUrl('https://www.who.int/page'), 'https://www.who.int/page');
  assert.equal(safeUrl('http://example.org/'), 'http://example.org/');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,<b>x</b>'), '');
  assert.equal(safeUrl('not a url'), '');
  assert.equal(safeUrl(undefined), '');
});

test('getCategoryClass maps European AQI bands to CSS classes', () => {
  assert.equal(getCategoryClass('Good'), 'aq-good');
  assert.equal(getCategoryClass('Fair'), 'aq-fair');
  assert.equal(getCategoryClass('Moderate'), 'aq-moderate');
  assert.equal(getCategoryClass('Poor'), 'aq-poor');
  assert.equal(getCategoryClass('Very Poor'), 'aq-very-poor');
  assert.equal(getCategoryClass('Extremely Poor'), 'aq-extreme');
  assert.equal(getCategoryClass('Poor (fixture)'), 'aq-poor');
  assert.equal(getCategoryClass(''), 'aq-unknown');
  assert.equal(getCategoryClass(undefined), 'aq-unknown');
});
