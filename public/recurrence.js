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
    let next = advance(start || today, repeat);
    // Preserve the original weekday or day-of-month when a task is completed late.
    for (let guard = 0; start && next <= today && guard < 1000; guard++) next = advance(next, repeat);
    return iso(next);
  }
  root.stillNextOccurrence = nextOccurrence;
  if (typeof module === 'object' && module.exports) module.exports = {nextOccurrence};
})(typeof globalThis !== 'undefined' ? globalThis : this);
