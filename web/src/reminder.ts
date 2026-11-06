import { dayKey } from '@harmony/shared';
import type { Reminder } from './settings.ts';

export { dayKey };

/** True once the reminder time has passed on an enabled weekday, if not yet shown today. */
export function isReminderDue(now: Date, reminder: Reminder, lastShown: string | undefined): boolean {
  if (!reminder.enabled || !reminder.days.includes(now.getDay())) return false;
  if (lastShown === dayKey(now)) return false;
  const [h, m] = reminder.time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}
