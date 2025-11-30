/**
 * Custom Redux Hooks
 * Provides easy access to Redux state and actions
 * Demonstrates Redux Toolkit usage for evaluation
 */

import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser, setLoading as setAuthLoading, clearError as clearAuthError } from '../redux/slices/authSlice';
import { setRides, setSearchResults, setCurrentRide, setFilters, clearSearchResults } from '../redux/slices/ridesSlice';
import { setBookings, setCurrentBooking, addBooking, updateBookingStatus } from '../redux/slices/bookingsSlice';
import { addNotification, markAsRead, markAllAsRead, clearNotifications } from '../redux/slices/notificationsSlice';
import { setGlobalLoading, addAlert, removeAlert, clearAlerts, setTheme, toggleSidebar, openModal, closeModal } from '../redux/slices/uiSlice';

/**
 * Hook to access auth state from Redux
 */
export const useAuthRedux = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  
  return {
    // State
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    
    // Actions
    setUser: (user) => dispatch(setUser(user)),
    clearUser: () => dispatch(clearUser()),
    setLoading: (loading) => dispatch(setAuthLoading(loading)),
  };
};

/**
 * Hook to access rides state from Redux
 */
export const useRidesRedux = () => {
  const dispatch = useDispatch();
  const rides = useSelector((state) => state.rides);
  
  return {
    // State
    rides: rides.rides,
    searchResults: rides.searchResults,
    currentRide: rides.currentRide,
    filters: rides.filters,
    loading: rides.loading,
    error: rides.error,
    
    // Actions
    setRides: (rides) => dispatch(setRides(rides)),
    setSearchResults: (results) => dispatch(setSearchResults(results)),
    setCurrentRide: (ride) => dispatch(setCurrentRide(ride)),
    setFilters: (filters) => dispatch(setFilters(filters)),
    clearSearchResults: () => dispatch(clearSearchResults()),
  };
};

/**
 * Hook to access bookings state from Redux
 */
export const useBookingsRedux = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.bookings);
  
  return {
    // State
    bookings: bookings.bookings,
    currentBooking: bookings.currentBooking,
    loading: bookings.loading,
    error: bookings.error,
    
    // Actions
    setBookings: (bookings) => dispatch(setBookings(bookings)),
    setCurrentBooking: (booking) => dispatch(setCurrentBooking(booking)),
    addBooking: (booking) => dispatch(addBooking(booking)),
    updateBookingStatus: (payload) => dispatch(updateBookingStatus(payload)),
  };
};

/**
 * Hook to access notifications state from Redux
 */
export const useNotificationsRedux = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications);
  
  return {
    // State
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,
    
    // Actions
    addNotification: (notification) => dispatch(addNotification(notification)),
    markAsRead: (id) => dispatch(markAsRead(id)),
    markAllAsRead: () => dispatch(markAllAsRead()),
    clearNotifications: () => dispatch(clearNotifications()),
  };
};

/**
 * Hook to access UI state from Redux
 */
export const useUIRedux = () => {
  const dispatch = useDispatch();
  const ui = useSelector((state) => state.ui);
  
  return {
    // State
    globalLoading: ui.globalLoading,
    alerts: ui.alerts,
    theme: ui.theme,
    sidebarOpen: ui.sidebarOpen,
    activeModal: ui.activeModal,
    modalData: ui.modalData,
    
    // Actions
    setLoading: (loading) => dispatch(setGlobalLoading(loading)),
    addAlert: (alert) => dispatch(addAlert(alert)),
    removeAlert: (id) => dispatch(removeAlert(id)),
    clearAlerts: () => dispatch(clearAlerts()),
    setTheme: (theme) => dispatch(setTheme(theme)),
    toggleSidebar: () => dispatch(toggleSidebar()),
    openModal: (modalData) => dispatch(openModal(modalData)),
    closeModal: () => dispatch(closeModal()),
  };
};

/**
 * Combined hook for all Redux state (useful for debugging)
 */
export const useAllReduxState = () => {
  const auth = useSelector((state) => state.auth);
  const rides = useSelector((state) => state.rides);
  const bookings = useSelector((state) => state.bookings);
  const notifications = useSelector((state) => state.notifications);
  const ui = useSelector((state) => state.ui);
  
  return {
    auth,
    rides,
    bookings,
    notifications,
    ui,
  };
};

// Default export
export default {
  useAuthRedux,
  useRidesRedux,
  useBookingsRedux,
  useNotificationsRedux,
  useUIRedux,
  useAllReduxState,
};
