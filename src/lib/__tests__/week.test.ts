import { describe, expect, it } from '@jest/globals';

import { dayKey, isRetained, partitionByRetention, retentionStart, trackedDays } from '../week';

// Monday, October 12, 2026 at 9:30 in the device's local time zone.
const monday = new Date(2026, 9, 12, 9, 30);
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();

describe('week retention', () => {
  it('keeps today plus the six days before it', () => {
    expect(dayKey(retentionStart(monday))).toBe('2026-10-06');
  });

  it("deletes the previous Monday's meals on Monday", () => {
    expect(isRetained(at(5, 23), monday)).toBe(false);
    expect(isRetained(at(6, 0), monday)).toBe(true);
    expect(isRetained(at(12, 8), monday)).toBe(true);
  });

  it('lists the seven tracked days oldest first, ending today', () => {
    expect(trackedDays(monday).map(dayKey)).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
    ]);
  });

  it('handles month boundaries', () => {
    expect(dayKey(retentionStart(new Date(2026, 10, 3)))).toBe('2026-10-28');
  });

  it('splits meals into kept and expired', () => {
    const meals = [{ createdAt: at(4) }, { createdAt: at(9) }, { createdAt: at(12) }];
    const { kept, expired } = partitionByRetention(meals, monday);
    expect(kept).toHaveLength(2);
    expect(expired).toEqual([{ createdAt: at(4) }]);
  });
});
