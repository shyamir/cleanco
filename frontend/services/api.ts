import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Update this to your backend URL

// Simple auth event listener for session expiry
type AuthFailureListener = () => void;
const authFailureListeners: Set<AuthFailureListener> = new Set();

export const authEvents = {
  onAuthFailure: (listener: AuthFailureListener) => {
    authFailureListeners.add(listener);
    return () => {
      authFailureListeners.delete(listener);
    };
  },
  emitAuthFailure: () => {
    authFailureListeners.forEach((listener) => listener());
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear all auth data (same as logout) and emit auth failure event
        await AsyncStorage.multiRemove([
          'accessToken',
          'refreshToken',
          'user',
          'firstName',
          'fullName',
          'email',
          'phone',
        ]);
        authEvents.emitAuthFailure();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
