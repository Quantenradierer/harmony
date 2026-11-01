import { describe, expect, it } from 'vitest';
import { dayKey, isReminderDue } from './reminder.ts';
import type { Reminder } from './settings.ts';

const r: Reminder = { enabled: true, time: '13:30', days: [1, 2] };
// 2026-11-02 is a Monday.
const at = (h: number, m: number, day = 2) => new Date(2026, 10, day, h, m);

describe('isReminderDue', () => {
  it('waits for the time', () => {
    expect(isReminderDue(at(13, 29), r, undefined)).toBe(false);
    expect(isReminderDue(at(13, 30), r, undefined)).toBe(true);
    expect(isReminderDue(at(18, 0), r, undefined)).toBe(true);
  });
  it('respects weekdays and enabled', () => {
    expect(isReminderDue(at(14, 0, 1), r, undefined)).toBe(false); // Sunday
    expect(isReminderDue(at(14, 0), { ...r, enabled: false }, undefined)).toBe(false);
  });
  it('fires once per day', () => {
    expect(isReminderDue(at(14, 0), r, dayKey(at(14, 0)))).toBe(false);
    expect(isReminderDue(at(14, 0), r, '2026-11-01')).toBe(true);
  });
});
