import api from './api';

export interface Zone {
  id: string;
  name: string;
}

export interface Address {
  id: string;
  label?: string;
  address: string;      // House/Apt number, floor, etc.
  street: string;       // Street/Magu
  landmark: string;     // Landmark/Goalhi
  zoneId: string;       // Zone ID
  zone?: Zone;          // Zone details when included
  latitude?: number;
  longitude?: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label?: string;
  address: string;      // House/Apt number, floor, etc.
  street: string;       // Street/Magu
  landmark: string;     // Landmark/Goalhi
  zoneId: string;       // Zone ID
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressRequest {
  label?: string;
  address?: string;
  street?: string;
  landmark?: string;
  zoneId?: string;
  latitude?: number;
  longitude?: number;
}

export const addressApi = {
  /**
   * Get all addresses for the current user
   */
  getUserAddresses: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return response.data;
  },

  /**
   * Get a specific address by ID
   */
  getAddress: async (id: string): Promise<Address> => {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  /**
   * Create a new address
   */
  createAddress: async (request: CreateAddressRequest): Promise<Address> => {
    const response = await api.post('/addresses', request);
    return response.data;
  },

  /**
   * Update an existing address
   */
  updateAddress: async (id: string, request: UpdateAddressRequest): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, request);
    return response.data;
  },

  /**
   * Set an address as primary
   */
  setPrimaryAddress: async (id: string): Promise<Address> => {
    const response = await api.put(`/addresses/${id}/primary`);
    return response.data;
  },

  /**
   * Delete an address
   */
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  /**
   * Get all available zones
   */
  getZones: async (): Promise<Zone[]> => {
    const response = await api.get('/zones');
    return response.data;
  },
};
