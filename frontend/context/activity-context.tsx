import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { bookingApi, ActivityBooking } from "@/services/bookingService";

type ActivityContextType = {
  upcomingBookings: ActivityBooking[];
  historyBookings: ActivityBooking[];
  isLoading: boolean;
  isRefreshing: boolean;
  refreshBookings: () => Promise<void>;
  clearBookings: () => void;
};

const ActivityContext = createContext<ActivityContextType | undefined>(
  undefined
);

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [upcomingBookings, setUpcomingBookings] = useState<ActivityBooking[]>(
    []
  );
  const [historyBookings, setHistoryBookings] = useState<ActivityBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const hasLoadedRef = useRef(false);

  const fetchBookings = useCallback(async (showRefreshing = false) => {
    // Check if user is authenticated before fetching
    const token = await AsyncStorage.getItem("accessToken");
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

      const [activity, history] = await Promise.all([
        bookingApi.getActivityBookings(),
        bookingApi.getHistoryBookings(),
      ]);

      setUpcomingBookings(activity);
      setHistoryBookings(history);
    } catch (error: any) {
      // Only log non-401 errors (401 means not authenticated)
      if (error.response?.status !== 401) {
        console.error("Failed to fetch bookings:", error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Clear bookings (call on logout)
  const clearBookings = useCallback(() => {
    setUpcomingBookings([]);
    setHistoryBookings([]);
    setIsLoading(true);
    hasLoadedRef.current = false;
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchBookings();
    }
  }, [fetchBookings]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground, refresh bookings
        fetchBookings(true);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [fetchBookings]);

  // Manual refresh function (exposed for pull-to-refresh and after actions)
  const refreshBookings = useCallback(async () => {
    await fetchBookings(true);
  }, [fetchBookings]);

  return (
    <ActivityContext.Provider
      value={{
        upcomingBookings,
        historyBookings,
        isLoading,
        isRefreshing,
        refreshBookings,
        clearBookings,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within ActivityProvider");
  }
  return context;
};
