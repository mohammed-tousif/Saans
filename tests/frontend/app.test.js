// Cover pure browser utilities with Node so these assertions need no DOM or server.
import assert from 'node:assert/strict';
import test from 'node:test';
import { safeUrl } from '../../app/static/dom.js';
import { getCategoryClass } from '../../app/static/views.js';

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
