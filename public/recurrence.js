'use strict';
(function (root) {
  const pad = value => String(value).padStart(2, '0');
  const iso = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const parse = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) && iso(date) === value ? date : null;
  };
  const addMonths = (date, months) => {
    const day = date.getDate();
    const first = new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
    const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12).getDate();
    first.setDate(Math.min(day, lastDay));
    return first;
  };
  const advance = (date, repeat) => repeat === 'daily'
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12)
    : repeat === 'weekly'
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7, 12)
      : addMonths(date, 1);
  function nextOccurrence(due, repeat, from) {
    if (!['daily', 'weekly', 'monthly'].includes(repeat)) return '';
    const today = parse(from) || parse(iso(new Date()));
    const start = parse(due);
    if (!start) return iso(advance(today, repeat));
    // Preserve the original weekday or day-of-month when a task is completed late.
    // Monthly steps are always computed from the original due date so a short
    // month (e.g. Feb 28) does not permanently pull the day-of-month earlier.
    let steps = 1;
    let next = repeat === 'monthly' ? addMonths(start, steps) : advance(start, repeat);
    for (let guard = 0; next <= today && guard < 1000; guard++) {
      steps += 1;
      next = repeat === 'monthly' ? addMonths(start, steps) : advance(next, repeat);
    }
    return iso(next);
  }
  root.stillNextOccurrence = nextOccurrence;
  if (typeof module === 'object' && module.exports) module.exports = {nextOccurrence};
})(typeof globalThis !== 'undefined' ? globalThis : this);
