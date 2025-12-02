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
   * Logout - clear all auth data
   */
  async logout(): Promise<void> {
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
};
