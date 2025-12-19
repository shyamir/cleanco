import {
  addDays,
  addWeeks,
  differenceInHours,
  startOfDay,
  format,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

// Maldives timezone constant (UTC+5, no DST)
export const MALDIVES_TIMEZONE = 'Indian/Maldives';

export class DateUtils {
  /**
   * Get current date/time as UTC
   * Use this for timestamp storage and comparisons with DB dates
   */
  static nowInMaldives(): Date {
    return new Date();
  }

  /**
   * Get today's date in Maldives timezone
   * Returns a UTC Date object representing noon in Maldives (to avoid day boundary issues)
   */
  static todayInMaldives(): Date {
    // Get today's date in Maldives as a string, then parse to UTC at noon
    const todayStr = formatInTimeZone(new Date(), MALDIVES_TIMEZONE, 'yyyy-MM-dd');
    return DateUtils.parseDateAsMaldives(todayStr);
  }

  /**
   * Convert a UTC date to Maldives timezone
   */
  static toMaldivesTime(date: Date): Date {
    return toZonedTime(date, MALDIVES_TIMEZONE);
  }

  /**
   * Convert a Maldives local date/time to UTC
   * Use this when you have a date in Maldives time and need to store it as UTC
   */
  static fromMaldivesTime(date: Date): Date {
    return fromZonedTime(date, MALDIVES_TIMEZONE);
  }

  /**
   * Format a date in Maldives timezone
   */
  static formatInMaldives(date: Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return formatInTimeZone(date, MALDIVES_TIMEZONE, formatStr);
  }

  /**
   * Parse a date string (yyyy-MM-dd) as a Maldives date at noon
   * and return the UTC equivalent.
   * Using noon (12:00) instead of midnight to avoid day boundary issues
   * when converting to/from UTC (Maldives is UTC+5).
   */
  static parseDateAsMaldives(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a date at noon in Maldives time (avoids day boundary issues)
    // Noon Maldives (12:00 UTC+5) = 07:00 UTC (same day)
    const maldivesDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    // Convert from Maldives time to UTC
    return fromZonedTime(maldivesDate, MALDIVES_TIMEZONE);
  }

  /**
   * Check if a date (in UTC) represents today in Maldives
   */
  static isTodayInMaldives(date: Date): boolean {
    const maldivesDate = toZonedTime(date, MALDIVES_TIMEZONE);
    const maldivesToday = DateUtils.todayInMaldives();
    return (
      maldivesDate.getFullYear() === maldivesToday.getFullYear() &&
      maldivesDate.getMonth() === maldivesToday.getMonth() &&
      maldivesDate.getDate() === maldivesToday.getDate()
    );
  }

  /**
   * Check if a date is in the past (compared to current Maldives time)
   */
  static isPastInMaldives(date: Date): boolean {
    const maldivesNow = DateUtils.nowInMaldives();
    const maldivesDate = toZonedTime(date, MALDIVES_TIMEZONE);
    return isBefore(maldivesDate, maldivesNow);
  }

  /**
   * Get start of day in Maldives for a given date
   */
  static startOfDayInMaldives(date: Date): Date {
    const maldivesDate = toZonedTime(date, MALDIVES_TIMEZONE);
    return startOfDay(maldivesDate);
  }
  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    return addDays(date, days);
  }

  /**
   * Add weeks to a date
   */
  static addWeeks(date: Date, weeks: number): Date {
    return addWeeks(date, weeks);
  }

  /**
   * Calculate hours between two dates
   */
  static hoursBetween(date1: Date, date2: Date): number {
    return differenceInHours(date2, date1);
  }

  /**
   * Get start of day
   */
  static startOfDay(date: Date): Date {
    return startOfDay(date);
  }

  /**
   * Format date to string
   */
  static format(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
    return format(date, formatStr);
  }

  /**
   * Parse ISO string to date
   */
  static parseISO(dateString: string): Date {
    return parseISO(dateString);
  }

  /**
   * Check if date1 is after date2
   */
  static isAfter(date1: Date, date2: Date): boolean {
    return isAfter(date1, date2);
  }

  /**
   * Check if date1 is before date2
   */
  static isBefore(date1: Date, date2: Date): boolean {
    return isBefore(date1, date2);
  }

  /**
   * Check if dates are equal
   */
  static isEqual(date1: Date, date2: Date): boolean {
    return isEqual(date1, date2);
  }

  /**
   * Check if a date is within a range
   */
  static isWithinRange(
    date: Date,
    startDate: Date,
    endDate: Date,
  ): boolean {
    return (
      (isEqual(date, startDate) || isAfter(date, startDate)) &&
      (isEqual(date, endDate) || isBefore(date, endDate))
    );
  }

  /**
   * Get dates for selected days of week over N weeks
   * @param startDate Starting date
   * @param selectedDays Array of day numbers (0=Sunday, 1=Monday, etc.)
   * @param weeks Number of weeks to generate
   */
  static getRecurringDates(
    startDate: Date,
    selectedDays: number[],
    weeks: number,
  ): Date[] {
    const dates: Date[] = [];
    const endDate = addWeeks(startDate, weeks);
    let currentDate = startDate;

    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
      const dayOfWeek = currentDate.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        dates.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  }
}
