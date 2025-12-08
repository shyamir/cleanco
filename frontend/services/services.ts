import api from './api';

export interface MinimumPrices {
  home: {
    minPrice: number | null;
    currency: string;
  };
  office: {
    minPrice: number | null;
    currency: string;
  };
}

export interface PricingRule {
  id: string;
  serviceType: 'HOME' | 'OFFICE';
  frequency: string | null; // null = one-time, 'ONCE_A_WEEK', 'TWICE_A_WEEK', 'THRICE_A_WEEK'
  bedrooms: number | null;
  officeSize: string | null;
  floors: number | null;
  rooms: number | null;
  price: number;
}

export const servicesApi = {
  /**
   * Get minimum prices for each service type
   */
  getMinimumPrices: async (): Promise<MinimumPrices> => {
    const response = await api.get('/services/pricing/minimums');
    return response.data;
  },

  /**
   * Get all pricing rules for a service type
   * Used for client-side price calculation
   */
  getPricingRules: async (serviceType: 'HOME' | 'OFFICE'): Promise<PricingRule[]> => {
    const response = await api.get(`/services/pricing/${serviceType}`);
    return response.data;
  },
};
