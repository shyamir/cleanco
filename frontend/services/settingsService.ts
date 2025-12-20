import api from './api';

export interface SupportContacts {
  phone: string | null;
  whatsapp: string | null;
}

export const settingsApi = {
  /**
   * Get customer support contact information
   */
  getSupportContacts: async (): Promise<SupportContacts> => {
    const response = await api.get('/settings/support-contacts');
    return response.data;
  },
};
