import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a safe default instead of throwing - prevents crashes
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      deleteNotification: async () => {},
      requestPermission: async () => false,
      refresh: async () => {},
      reassignmentAlert: null,
      clearReassignmentAlert: () => {}
    };
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Special state for reassignment alerts (shown as modal)
  const [reassignmentAlert, setReassignmentAlert] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('notification:new', handleNewNotification);
      socket.on('notification:read', handleNotificationRead);
      
      // NEW: Handle booking reassignment events
      socket.on('booking-reassigned', handleBookingReassigned);
      socket.on('ride-cancelled', handleRideCancelled);
      socket.on('new-booking', handleNewBooking);
      
      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:read', handleNotificationRead);
        socket.off('booking-reassigned', handleBookingReassigned);
        socket.off('ride-cancelled', handleRideCancelled);
        socket.off('new-booking', handleNewBooking);
      };
    }
  }, [socket, isConnected]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await userService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });
    }
  }, []);

  const handleNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // NEW: Handle booking reassignment - show prominent alert
  const handleBookingReassigned = useCallback((data) => {
    console.log('🔄 [Notification] Booking reassigned event:', data);
    
    // Add to notifications
    if (data.notification) {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
    
    // Show special reassignment alert modal
    setReassignmentAlert({
      type: 'REASSIGNED',
      title: '🔄 Your Ride Has Been Reassigned!',
      message: `Your original ride was cancelled, but we found you an alternative ride!`,
      newBooking: data.newBooking,
      originalBooking: data.originalBooking,
      matchScore: data.newBooking?.matchScore
    });
    
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('🔄 Ride Reassigned!', {
        body: `We found you an alternative ride. Tap to view details.`,
        icon: '/logo192.png',
        tag: 'reassignment'
      });
    }
  }, []);

  // NEW: Handle ride cancellation without alternative
  const handleRideCancelled = useCallback((data) => {
    console.log('❌ [Notification] Ride cancelled event:', data);
    
    // Add to notifications
    if (data.notification) {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
    
    // Show cancellation alert if no alternative was found
    if (data.type === 'RIDE_CANCELLED_NO_ALTERNATIVE') {
      setReassignmentAlert({
        type: 'CANCELLED_NO_ALTERNATIVE',
        title: '❌ Ride Cancelled',
        message: data.message || 'Your ride was cancelled and no alternative rides are available.',
        booking: data.booking,
        refundAmount: data.booking?.refundAmount
      });
    } else {
      // Regular cancellation
      setReassignmentAlert({
        type: 'CANCELLED',
        title: '❌ Ride Cancelled',
        message: 'Your ride has been cancelled by the rider.',
        booking: data.booking,
        refundAmount: data.booking?.refundAmount
      });
    }
    
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('❌ Ride Cancelled', {
        body: data.message || 'Your ride has been cancelled.',
        icon: '/logo192.png',
        tag: 'cancellation'
      });
    }
  }, []);

  // NEW: Handle new booking for riders (when they receive reassigned passenger)
  const handleNewBooking = useCallback((data) => {
    console.log('📥 [Notification] New booking event:', data);
    
    if (data.notification) {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
    
    // Show alert for reassigned passenger
    if (data.type === 'NEW_BOOKING_REASSIGNED') {
      setReassignmentAlert({
        type: 'NEW_PASSENGER_REASSIGNED',
        title: '📥 New Reassigned Passenger',
        message: `${data.booking?.passenger || 'A passenger'} has been reassigned to your ride.`,
        booking: data.booking
      });
    }
    
    // Browser notification
    if (Notification.permission === 'granted' && data.booking?.isReassignment) {
      new Notification('📥 New Passenger (Reassigned)', {
        body: `${data.booking?.passenger || 'A passenger'} was reassigned to your ride.`,
        icon: '/logo192.png',
        tag: 'new-booking'
      });
    }
  }, []);

  // Clear the reassignment alert
  const clearReassignmentAlert = useCallback(() => {
    setReassignmentAlert(null);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await userService.markNotificationRead(notificationId);
      handleNotificationRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await userService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPermission,
    refresh: fetchNotifications,
    reassignmentAlert,
    clearReassignmentAlert
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
