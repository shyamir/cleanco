import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { servicesApi } from '@/services/services';
import { bookingApi, UpcomingBooking } from '@/services/bookingService';
import { promoApi, PromoCode } from '@/services/promoService';

interface HomeData {
  homePrice: string;
  officePrice: string;
  upcomingBooking: UpcomingBooking | null;
  promos: PromoCode[];
  isLoading: boolean;
  isRefreshing: boolean;
}

interface HomeDataContextType extends HomeData {
  refreshHomeData: () => Promise<void>;
}

const HomeDataContext = createContext<HomeDataContextType | undefined>(undefined);

export const HomeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homePrice, setHomePrice] = useState<string>('--');
  const [officePrice, setOfficePrice] = useState<string>('--');
  const [upcomingBooking, setUpcomingBooking] = useState<UpcomingBooking | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const appState = useRef(AppState.currentState);
  const hasLoadedRef = useRef(false);

  const fetchAllData = useCallback(async (showRefreshing = false) => {
    // Check if user is authenticated before fetching
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      // Not authenticated, skip fetching
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      // Fetch all data in parallel
      const [prices, booking, activePromos] = await Promise.all([
        servicesApi.getMinimumPrices().catch(() => null),
        bookingApi.getUpcomingBooking().catch(() => null),
        promoApi.getActivePromos().catch(() => []),
      ]);

      if (prices) {
        if (prices.home.minPrice !== null) {
          setHomePrice(prices.home.minPrice.toString());
        }
        if (prices.office.minPrice !== null) {
          setOfficePrice(prices.office.minPrice.toString());
        }
      }

      setUpcomingBooking(booking);
      setPromos(activePromos);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchAllData();
    }
  }, [fetchAllData]);

  // Handle app state changes (background -> foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App came to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchAllData(true);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchAllData]);

  // Manual refresh function (exposed for pull-to-refresh and after actions)
  const refreshHomeData = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  return (
    <HomeDataContext.Provider
      value={{
        homePrice,
        officePrice,
        upcomingBooking,
        promos,
        isLoading,
        isRefreshing,
        refreshHomeData,
      }}
    >
      {children}
    </HomeDataContext.Provider>
  );
};

export const useHomeData = () => {
  const context = useContext(HomeDataContext);
  if (context === undefined) {
    throw new Error('useHomeData must be used within a HomeDataProvider');
  }
  return context;
};
