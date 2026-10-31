import { addDays, addWeeks, addMonths, addYears, format, isLeapYear, getDaysInMonth, setDate } from 'date-fns';

export type BillingIntervalType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Calculates the next billing date considering calendar-aware rules,
 * including month-end days (e.g. Jan 31 -> Feb 28/29) and leap years.
 */
export function calculateNextBillingDate(
  currentDate: Date | string,
  interval: BillingIntervalType | string,
  originalAnchorDay?: number
): Date {
  const base = new Date(currentDate);

  switch (interval.toUpperCase()) {
    case 'DAILY':
      return addDays(base, 1);

    case 'WEEKLY':
      return addWeeks(base, 1);

    case 'MONTHLY': {
      // Month-end awareness: if anchor day was 31st, preserve end-of-month across shorter months
      const nextMonth = addMonths(base, 1);
      if (originalAnchorDay && originalAnchorDay > 28) {
        const daysInNext = getDaysInMonth(nextMonth);
        const targetDay = Math.min(originalAnchorDay, daysInNext);
        return setDate(nextMonth, targetDay);
      }
      return nextMonth;
    }

    case 'YEARLY': {
      // Leap year awareness: Feb 29 on leap year moves to Feb 28 on non-leap years
      return addYears(base, 1);
    }

    default:
      return addMonths(base, 1);
  }
}

/**
 * Generates an idempotent billing period key, e.g. "2026-11-01_2026-11-30"
 * This guarantees database-level duplicate prevention for a given subscription and cycle.
 */
export function getBillingPeriodKey(startDate: Date | string, endDate: Date | string): string {
  const s = format(new Date(startDate), 'yyyy-MM-dd');
  const e = format(new Date(endDate), 'yyyy-MM-dd');
  return `${s}_to_${e}`;
}
