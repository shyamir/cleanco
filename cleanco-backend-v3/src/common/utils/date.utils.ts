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

export class DateUtils {
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
