export type BookingType = "home cleaning" | "office cleaning";

export type Booking = {
  id: string;
  title: string;
  status: "upcoming" | "completed" | "cancelled" | "pending";
  address: string;
  schedule: string;
  details: string;
  instructions: string;
  cleaner: string;
  total: string;
  type: BookingType;
  date: string; // For grouping
  time: string; // Extracted from schedule
  image?: any;
};

export const MOCK_BOOKINGS: Record<string, Booking> = {
  "1001": {
    id: "1001",
    title: "Home Cleaning",
    status: "cancelled",
    address: "G12 Service Road, Male, Maldives",
    schedule: "30 Aug 2025, 10:00",
    details: "Apartment cleaning - 3 rooms",
    instructions: "Please call before arrival.",
    cleaner: "Aisha Ibrahim",
    total: "MVR 450",
    type: "home cleaning",
    date: "30 Aug 2025",
    time: "10:00",
  },
  "1002": {
    id: "1002",
    title: "Home Cleaning",
    status: "upcoming",
    address: "Hiyaa Towers H11, Nirolhu Magu, Male, Maldives",
    schedule: "1 Sep 2025, 08:00",
    details: "2 bedrooms, 1 bathroom, No Pets",
    instructions: "-",
    cleaner: "Manish Sureshkumar",
    total: "MVR 304.5",
    type: "home cleaning",
    date: "30 Nov 2025",
    time: "08:00",
  },
  "1003": {
    id: "1003",
    title: "Office Cleaning",
    status: "pending",
    address: "G12 Service Road, Male, Maldives",
    schedule: "30 Aug 2025, 12:00",
    details: "Apartment cleaning - 3 rooms",
    instructions: "Please call before arrival.",
    cleaner: "Aisha Ibrahim",
    total: "MVR 450",
    type: "office cleaning",
    date: "28 Nov 2025",
    time: "12:00",
  },
  "1004": {
    id: "1004",
    title: "Office Cleaning",
    status: "completed",
    address: "Hiyaa Towers H11, Nirolhu Magu, Male, Maldives",
    schedule: "1 Sep 2025, 08:00",
    details: "2 bedrooms, 1 bathroom, No Pets",
    instructions: "-",
    cleaner: "Manish Sureshkumar",
    total: "MVR 304.5",
    type: "office cleaning",
    date: "3 Sep 2025",
    time: "08:00",
  },
};
