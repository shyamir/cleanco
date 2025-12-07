import api from './api';

// Enums matching backend
export enum ServiceType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
}

export enum BookingType {
  ONE_TIME = 'ONE_TIME',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum SubscriptionFrequency {
  ONCE_A_WEEK = 'ONCE_A_WEEK',
  TWICE_A_WEEK = 'TWICE_A_WEEK',
  THRICE_A_WEEK = 'THRICE_A_WEEK',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  BML_GATEWAY = 'BML_GATEWAY',
}

// Types
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  displayStartTime: string;  // User-friendly format like "08:00 AM"
  isActive: boolean;
}

export interface AvailableSlot {
  id: string;
  startTime: string;
  endTime: string;
  displayTime: string;  // User-friendly format like "08:00 AM"
  isAvailable: boolean;
  availableCapacity: number;
  requiredCleaners?: number;
}

export interface AvailableSlotsQueryOptions {
  serviceType?: ServiceType;
  bedrooms?: number;
  officeSize?: string;
  floors?: number;
  rooms?: number;
}

export interface AvailableSlotsResponse {
  date: string;
  availableSlots: AvailableSlot[];
}

// Subscription availability types
export interface SubscriptionSlotAvailability {
  id: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  isAvailableFor12Weeks: boolean;
  unavailableDates?: string[];
  availableCapacityMin: number;
  requiredCleaners: number;
}

export interface SubscriptionAvailabilityResponse {
  startDate: string;
  dayOfWeek: number;
  datesToCheck: string[];
  availableSlots: SubscriptionSlotAvailability[];
}

export interface SubscriptionAvailabilityQueryOptions {
  serviceType?: ServiceType;
  bedrooms?: number;
  officeSize?: string;
  floors?: number;
  rooms?: number;
}

export interface QuoteRequest {
  serviceType: ServiceType;
  bedrooms?: number;
  frequency?: SubscriptionFrequency;
  officeSize?: string;
  floors?: number;
  rooms?: number;
  promoCode?: string;
}

export interface QuoteResponse {
  pricing: {
    basePrice: number;
    discount: number;
    finalPrice: number;
  };
}

export interface CreateBookingRequest {
  serviceType: ServiceType;
  bookingType: BookingType;
  addressId: string;
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  bedrooms?: number;
  bathrooms?: number;
  hasPets?: boolean;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  promoCode?: string;
}

export interface CreateSubscriptionRequest {
  serviceType: ServiceType;
  frequency: SubscriptionFrequency;
  addressId: string;
  timeSlotId: string;
  selectedDays: number[]; // 0-6 (Sunday-Saturday)
  bedrooms?: number;
  bathrooms?: number;
  hasPets?: boolean;
  officeSize?: string;
  floors?: number;
  rooms?: number;
}

export interface Address {
  id: string;
  label?: string;
  address: string;  // House/Apt number, floor
  street: string;   // Street/Magu
  landmark: string; // Landmark/Goalhi
}

export interface Booking {
  id: string;
  bookingNumber: string;
  serviceType: ServiceType;
  bookingType: BookingType;
  status: string;
  date: string;
  totalPrice: number;
  finalPrice: number;
}

export interface UpcomingBooking {
  id: string;
  bookingNumber: string;
  serviceType: ServiceType;
  bookingType: BookingType;
  status: string;
  date: string;
  totalPrice: number;
  finalPrice: number;
  address: Address;
  timeSlot: TimeSlot;
}

export interface Subscription {
  id: string;
  serviceType: ServiceType;
  frequency: SubscriptionFrequency;
  status: string;
  monthlyPrice: number;
  selectedDays: number[];
}

// Helper function to map frontend frequency to backend enum
export const mapFrequencyToBackend = (
  frequency: string
): { isSubscription: boolean; subscriptionFrequency?: SubscriptionFrequency } => {
  switch (frequency) {
    case 'Once':
      return { isSubscription: false };
    case '1x /week':
      return { isSubscription: true, subscriptionFrequency: SubscriptionFrequency.ONCE_A_WEEK };
    case '2x /week':
      return { isSubscription: true, subscriptionFrequency: SubscriptionFrequency.TWICE_A_WEEK };
    case '3x /week':
      return { isSubscription: true, subscriptionFrequency: SubscriptionFrequency.THRICE_A_WEEK };
    default:
      return { isSubscription: false };
  }
};

// Helper function to map day name to number
export const mapDayToNumber = (day: string): number => {
  const days: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return days[day] ?? 0;
};

// Helper function to map number to day name
export const mapNumberToDay = (num: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[num] ?? 'Sunday';
};

export const bookingApi = {
  /**
   * Calculate price quote for a service
   */
  calculateQuote: async (request: QuoteRequest): Promise<QuoteResponse> => {
    const response = await api.post('/services/quote', request);
    return response.data;
  },

  /**
   * Get all time slots
   */
  getTimeSlots: async (): Promise<TimeSlot[]> => {
    const response = await api.get('/time-slots');
    return response.data;
  },

  /**
   * Get available time slots for a specific date
   * Optionally pass booking details to check if enough cleaners are available
   */
  getAvailableSlots: async (
    date: string,
    options?: AvailableSlotsQueryOptions
  ): Promise<AvailableSlotsResponse> => {
    const response = await api.get('/time-slots/available', {
      params: { date, ...options },
    });
    return response.data;
  },

  /**
   * Get available time slots for subscription across 12 weeks
   * Checks availability for each occurrence of the selected day of week
   */
  getSubscriptionAvailability: async (
    startDate: string,
    dayOfWeek: number,
    options?: SubscriptionAvailabilityQueryOptions
  ): Promise<SubscriptionAvailabilityResponse> => {
    const response = await api.get('/time-slots/subscription-availability', {
      params: { startDate, dayOfWeek, ...options },
    });
    return response.data;
  },

  /**
   * Create a one-time booking
   */
  createBooking: async (request: CreateBookingRequest): Promise<Booking> => {
    const response = await api.post('/bookings', request);
    return response.data;
  },

  /**
   * Create a subscription
   */
  createSubscription: async (request: CreateSubscriptionRequest): Promise<Subscription> => {
    const response = await api.post('/subscriptions', request);
    return response.data;
  },

  /**
   * Get user's bookings
   */
  getUserBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings');
    return response.data;
  },

  /**
   * Get user's subscriptions
   */
  getUserSubscriptions: async (): Promise<Subscription[]> => {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  /**
   * Get user's next upcoming booking
   */
  getUpcomingBooking: async (): Promise<UpcomingBooking | null> => {
    const response = await api.get('/bookings/upcoming');
    return response.data;
  },
};
