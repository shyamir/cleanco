import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  isNewUser: boolean;
}

export const authService = {
  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number with country code (e.g., "+9607777777")
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    const response = await api.post<SendOtpResponse>('/auth/send-otp', {
      phoneNumber,
    });
    return response.data;
  },

  /**
   * Verify OTP and authenticate user
   * @param phoneNumber - Phone number with country code
   * @param code - OTP code
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<VerifyOtpResponse> {
    const response = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
      phoneNumber,
      code,
    });
    return response.data;
  },

  /**
   * Store authentication tokens
   */
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  },

  /**
   * Store user data
   */
  async storeUser(user: User): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    if (user.firstName) {
      await AsyncStorage.setItem('firstName', user.firstName);
    }
    if (user.email) {
      await AsyncStorage.setItem('email', user.email);
    }
  },

  /**
   * Get stored user
   */
  async getUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Logout - revoke refresh token on backend and clear all auth data
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        // Call backend to revoke the refresh token
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Continue with local logout even if backend call fails
      console.warn('Failed to revoke token on server:', error);
    }

    // Clear local storage
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'user',
      'firstName',
      'email',
      'phone',
    ]);
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },

  /**
   * Update user profile
   * @param firstName - First name (required)
   * @param lastName - Last name (optional)
   * @param email - Email address (optional)
   */
  async updateProfile(data: {
    firstName: string;
    lastName?: string;
    email?: string;
  }): Promise<User> {
    const response = await api.put<User>('/users/me', data);

    // Update stored user data
    await this.storeUser(response.data);

    return response.data;
  },
};
