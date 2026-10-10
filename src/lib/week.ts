/**
 * Meals are kept for a rolling window of seven calendar days: today plus the six days before it.
 * When a new day starts, the day that is now eight days old is deleted. On a Monday, for example,
 * the previous Monday's meals are removed.
 *
 * All math uses the device's local calendar days, so daylight saving changes don't shift the window.
 */
export const RETENTION_DAYS = 7;

export function startOfDay(timestamp: number | Date): Date {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Local calendar day as "YYYY-MM-DD", used to group meals by day. */
export function dayKey(timestamp: number | Date): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isSameDay(a: number | Date, b: number | Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** Midnight at the start of the oldest day that is still kept. */
export function retentionStart(now: number | Date): Date {
  return addDays(startOfDay(now), -(RETENTION_DAYS - 1));
}

export function isRetained(createdAt: number, now: number | Date): boolean {
  return createdAt >= retentionStart(now).getTime();
}

/** The seven tracked days, oldest first, ending with today. */
export function trackedDays(now: number | Date): Date[] {
  const start = retentionStart(now);
  return Array.from({ length: RETENTION_DAYS }, (_, index) => addDays(start, index));
}

/** Splits items into those still inside the window and those that should be deleted. */
export function partitionByRetention<T extends { createdAt: number }>(
  items: T[],
  now: number | Date,
): { kept: T[]; expired: T[] } {
  const kept: T[] = [];
  const expired: T[] = [];
  for (const item of items) {
    (isRetained(item.createdAt, now) ? kept : expired).push(item);
  }
  return { kept, expired };
}
