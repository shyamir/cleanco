export type BookingStatus = "upcoming" | "completed" | "cancelled" | "pending";

export type Booking = {
  id: string;
  type: "home" | "office";
  title: string;
  address: string;
  schedule: string;
  time: string;
  details: string;
  instructions?: string;
  cleaner: string;
  total: string;
  status: BookingStatus;
};
