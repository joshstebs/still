import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';

const source = fs.readFileSync(new URL('../public/recurrence.js', import.meta.url), 'utf8');
const sandbox = {exports: {}};
new Function('module', 'exports', source)(sandbox, sandbox.exports, globalThis);
const {nextOccurrence} = sandbox.exports;

test('recurring tasks roll forward daily, weekly and monthly', () => {
  assert.equal(nextOccurrence('2026-01-29', 'daily', '2026-01-29'), '2026-01-30');
  assert.equal(nextOccurrence('2026-01-01', 'weekly', '2026-01-20'), '2026-01-22');
  assert.equal(nextOccurrence('2026-02-10', 'weekly', '2026-02-01'), '2026-02-17');
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-01-31'), '2026-02-28');
  assert.equal(nextOccurrence('2024-01-31', 'monthly', '2024-01-31'), '2024-02-29');
  assert.equal(nextOccurrence('2026-01-01', 'daily', '2026-01-20'), '2026-01-21');
});

test('late monthly completion keeps the original day-of-month anchor', () => {
  // Previously drifted to 2026-03-28 because the catch-up loop stepped from Feb 28.
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-03-15'), '2026-03-31');
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-04-30'), '2026-05-31');
  assert.equal(nextOccurrence('2026-01-30', 'monthly', '2026-03-01'), '2026-03-30');
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-02-27'), '2026-02-28');
  assert.equal(nextOccurrence('2026-01-31', 'monthly', '2026-02-28'), '2026-03-31');
  assert.equal(nextOccurrence('2025-12-31', 'monthly', '2026-02-15'), '2026-02-28');
  assert.equal(nextOccurrence('2026-01-15', 'monthly', '2027-01-20'), '2027-02-15');
  // Daily and weekly catch-up keep their weekday/interval.
  assert.equal(nextOccurrence('2026-01-05', 'weekly', '2026-03-04'), '2026-03-09');
});

test('recurring tasks handle missing, invalid and unsupported schedules', () => {
  assert.equal(nextOccurrence('', 'daily', '2026-02-01'), '2026-02-02');
  assert.equal(nextOccurrence('bad', 'daily', '2026-02-01'), '2026-02-02');
  assert.equal(nextOccurrence('2026-02-01', '', '2026-02-01'), '');
  assert.equal(nextOccurrence('2026-02-01', 'yearly', '2026-02-01'), '');
});
