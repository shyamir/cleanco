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

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  VERIFIED = 'VERIFIED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export interface BmlPaymentResponse {
  payment: {
    id: string;
    bookingId?: string;
    subscriptionId?: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatusEnum;
    transactionId?: string;
  };
  paymentUrl: string;
  message: string;
}

// Checkout session types
export interface CheckoutSessionResponse {
  checkoutSessionId: string;
  expiresAt: string;
  holdDurationSeconds: number;
  price: {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
  };
  slotsReserved?: number; // For subscriptions
}

export interface CheckoutSessionStatus {
  id: string;
  type: 'BOOKING' | 'SUBSCRIPTION';
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  expiresAt: string;
  remainingSeconds: number;
  isExpired: boolean;
  createdAt: string;
}

export interface CheckoutBmlPaymentResponse {
  paymentId: string;
  redirectUrl: string;
  transactionId: string;
  expiresAt: string;
}

export interface CheckoutBankTransferResponse {
  payment: any;
  booking?: Booking;
  subscription?: Subscription;
}

export interface PaymentStatus {
  id: string;
  bookingId?: string;
  subscriptionId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatusEnum;
  transactionId?: string;
  paidAt?: string;
  verifiedAt?: string;
  failureReason?: string;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
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
  requiredCleaners?: number;
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
  requiredCleaners?: number;
}

export interface QuoteRequest {
  serviceType: ServiceType;
  bedrooms?: number;
  frequency?: SubscriptionFrequency;
  // Office-specific fields
  squareFeet?: number;
  floors?: number;
  rooms?: number;
  toilets?: number;
  promoCode?: string;
}

export interface QuoteResponse {
  isEstimate?: boolean; // True for office bookings (pending inspection)
  pricing: {
    basePrice: number;
    sqftTierPrice?: number;
    roomAddOn?: number;
    toiletAddOn?: number;
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
  // Home-specific fields
  bedrooms?: number;
  bathrooms?: number;
  hasPets?: boolean;
  // Office-specific fields
  squareFeet?: number;
  floors?: number;
  rooms?: number;
  toilets?: number;
  // Common fields
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  promoCode?: string;
}

// Day slot for subscription - maps day of week to time slot
export interface DaySlot {
  day: number; // 0-6 (Sunday-Saturday)
  timeSlotId: string;
}

export interface CreateSubscriptionRequest {
  serviceType: ServiceType;
  frequency: SubscriptionFrequency;
  addressId: string;
  daySlots: DaySlot[]; // Array of day-timeslot pairs
  startDate?: string; // Start date in YYYY-MM-DD format (defaults to tomorrow if not provided)
  // Home-specific fields
  bedrooms?: number;
  bathrooms?: number;
  hasPets?: boolean;
  // Office-specific fields
  squareFeet?: number;
  floors?: number;
  rooms?: number;
  toilets?: number;
  specialInstructions?: string;
  promoCode?: string;
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
  paymentStatus: string;
  date: string;
  totalPrice: number;
  finalPrice: number;
  address: Address;
  timeSlot: TimeSlot;
  // Address snapshot (captured at booking time for historical accuracy)
  addressLabel?: string;
  addressAddress?: string;
  addressStreet?: string;
  addressLandmark?: string;
  // Cleaner assignment count (for reschedule availability)
  assignedCleanerCount?: number;
}

// ActivityBooking is the same as UpcomingBooking (used for activity/history pages)
export type ActivityBooking = UpcomingBooking;

// Detailed booking info returned by getBookingById
export interface BookingDetails extends UpcomingBooking {
  bedrooms?: number;
  bathrooms?: number;
  hasPets?: boolean;
  // Office-specific fields
  squareFeet?: number;
  floors?: number;
  rooms?: number;
  toilets?: number;
  estimatedPrice?: number;
  confirmedPrice?: number;
  priceAdjustmentReason?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  discountAmount?: number;
  // Cleaner assignment count (for reschedule availability)
  assignedCleanerCount?: number;
}

// Subscription day slot with time slot details
export interface SubscriptionDaySlot {
  id: string;
  dayOfWeek: number;
  timeSlotId: string;
  timeSlot: TimeSlot;
}

export interface Subscription {
  id: string;
  serviceType: ServiceType;
  frequency: SubscriptionFrequency;
  status: string;
  monthlyPrice: number;
  selectedDays: number[];
  address: Address;
  // Address snapshot (captured at subscription time for historical accuracy)
  addressLabel?: string;
  addressAddress?: string;
  addressStreet?: string;
  addressLandmark?: string;
  timeSlot?: TimeSlot; // Deprecated, use daySlots
  daySlots: SubscriptionDaySlot[]; // Day-specific time slots
  startDate: string;
  nextBillingDate: string;
  endDate?: string;
  bookings?: { date: string }[]; // First booking (for displaying start date)
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

  /**
   * Get all upcoming bookings for activity page
   * Shows all one-time bookings + subscription bookings only until next billing date
   */
  getActivityBookings: async (): Promise<ActivityBooking[]> => {
    const response = await api.get('/bookings/activity');
    return response.data;
  },

  /**
   * Get past bookings for history page
   */
  getHistoryBookings: async (): Promise<ActivityBooking[]> => {
    const response = await api.get('/bookings/history');
    return response.data;
  },

  /**
   * Get quotes (pending inspection bookings)
   * These are office bookings awaiting price confirmation
   */
  getQuotes: async (): Promise<ActivityBooking[]> => {
    const response = await api.get('/bookings/quotes');
    return response.data;
  },

  /**
   * Get booking details by ID
   */
  getBookingById: async (id: string): Promise<BookingDetails> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Cancel a booking
   * @param id - Booking ID
   * @param cancelReason - Optional reason for cancellation
   */
  cancelBooking: async (id: string, cancelReason?: string): Promise<void> => {
    await api.put(`/bookings/${id}/cancel`, { cancelReason });
  },

  /**
   * Reschedule a booking
   * @param id - Booking ID
   * @param newDate - New date in YYYY-MM-DD format
   * @param newTimeSlotId - New time slot ID
   */
  rescheduleBooking: async (id: string, newDate: string, newTimeSlotId: string): Promise<void> => {
    await api.put(`/bookings/${id}/reschedule`, { newDate, newTimeSlotId });
  },

  /**
   * Cancel a subscription
   * @param id - Subscription ID
   */
  cancelSubscription: async (id: string): Promise<void> => {
    await api.patch(`/subscriptions/${id}/cancel`);
  },

  // ============================================
  // BML Payment Methods
  // ============================================

  /**
   * Initiate BML payment for a booking
   * @param bookingId - Booking ID
   * @returns Payment details with BML payment URL
   */
  initiateBmlPayment: async (bookingId: string): Promise<BmlPaymentResponse> => {
    const response = await api.post('/payments/bml', { bookingId });
    return response.data;
  },

  /**
   * Initiate BML payment for subscription renewal
   * @param subscriptionId - Subscription ID
   * @returns Payment details with BML payment URL
   */
  initiateBmlSubscriptionPayment: async (subscriptionId: string): Promise<BmlPaymentResponse> => {
    const response = await api.post('/payments/subscription/bml', { subscriptionId });
    return response.data;
  },

  /**
   * Get payment status by ID
   * @param paymentId - Payment ID
   * @returns Payment status details
   */
  getPaymentStatus: async (paymentId: string): Promise<PaymentStatus> => {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  },

  // ============================================
  // Checkout Session Methods (Soft Slot Holds)
  // ============================================

  /**
   * Create a checkout session for a one-time booking
   * This reserves the slot for 5 minutes while user completes payment
   */
  createBookingCheckout: async (request: CreateBookingRequest): Promise<CheckoutSessionResponse> => {
    const response = await api.post('/checkout/booking', request);
    return response.data;
  },

  /**
   * Create a checkout session for a subscription
   * This reserves all slots for 12 weeks for 5 minutes
   */
  createSubscriptionCheckout: async (request: CreateSubscriptionRequest): Promise<CheckoutSessionResponse> => {
    const response = await api.post('/checkout/subscription', request);
    return response.data;
  },

  /**
   * Get checkout session status and remaining time
   */
  getCheckoutSession: async (sessionId: string): Promise<CheckoutSessionStatus> => {
    const response = await api.get(`/checkout/${sessionId}`);
    return response.data;
  },

  /**
   * Cancel a checkout session and release slot holds
   */
  cancelCheckout: async (sessionId: string): Promise<void> => {
    await api.delete(`/checkout/${sessionId}`);
  },

  /**
   * Complete checkout with bank transfer
   * Creates the booking/subscription and records payment as pending
   */
  processCheckoutBankTransfer: async (
    checkoutSessionId: string,
    receiptUrl?: string
  ): Promise<CheckoutBankTransferResponse> => {
    const response = await api.post('/payments/checkout/bank-transfer', {
      checkoutSessionId,
      receiptUrl,
    });
    return response.data;
  },

  /**
   * Initiate BML payment for checkout session
   * Returns URL to redirect user to BML payment page
   */
  initiateCheckoutBmlPayment: async (
    checkoutSessionId: string
  ): Promise<CheckoutBmlPaymentResponse> => {
    const response = await api.post('/payments/checkout/bml', { checkoutSessionId });
    return response.data;
  },
};
