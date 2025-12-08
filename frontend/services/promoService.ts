import api from './api';

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  applicableServices: ('HOME' | 'OFFICE')[];
  minPurchaseAmount: number | null;
}

export interface PromoValidationResult {
  valid: boolean;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | '';
  discountValue: number;
  message?: string;
}

export const promoApi = {
  /**
   * Get active public promos for carousel display
   */
  getActivePromos: async (): Promise<PromoCode[]> => {
    const response = await api.get('/promo-codes/active');
    return response.data;
  },

  /**
   * Validate a promo code for the current user
   */
  validatePromo: async (
    code: string,
    serviceType: 'HOME' | 'OFFICE',
    purchaseAmount: number
  ): Promise<PromoValidationResult> => {
    const response = await api.post('/promo-codes/validate', {
      code,
      serviceType,
      purchaseAmount,
    });
    return response.data;
  },
};
