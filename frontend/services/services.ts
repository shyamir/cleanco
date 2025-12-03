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

export const servicesApi = {
  /**
   * Get minimum prices for each service type
   */
  getMinimumPrices: async (): Promise<MinimumPrices> => {
    const response = await api.get('/services/pricing/minimums');
    return response.data;
  },
};
