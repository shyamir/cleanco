// utils/date.ts

// Map month abbreviation → month number
const MONTH_MAP: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

// Parse booking date and time into a Date object
export function parseBookingDate(date: string, time: string) {
  const [day, monthAbbrev, year] = date.split(" ");
  const [hour, minute] = time.split(":");

  return new Date(
    Number(year),
    MONTH_MAP[monthAbbrev],
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0
  );
}

// Check if booking is in the past
export function isPastBooking(date: string, time: string) {
  const bookingDate = parseBookingDate(date, time);
  const now = new Date();
  return bookingDate < now;
}

// Check if booking is upcoming
export function isUpcomingBooking(date: string, time: string) {
  const bookingDate = parseBookingDate(date, time);
  const now = new Date();
  return bookingDate >= now;
}

// Check if booking is today or tomorrow
export const isTodayOrTomorrow = (date: string, time: string) => {
  const bookingDate = parseBookingDate(date, time);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const bDay = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    bookingDate.getDate()
  );

  if (bDay.getTime() === today.getTime()) return "Today";
  if (bDay.getTime() === tomorrow.getTime()) return "Tomorrow";
  return null; // Not today or tomorrow
};

// Convert string to Upper Camel Case
export const toTitleCase = (str: string) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());
