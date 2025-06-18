import { useEffect, useState } from 'react';
import axios from 'axios';
import notificationService from '../services/notificationService';

export default function useNotifications(userId) {
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Web push states
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch notifications');
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `/api/notifications/${notificationId}/read`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Initialize web push notifications
  const initPushNotifications = async () => {
    try {
      // Access isSupported as property, not function
      setIsSupported(notificationService.isSupported);
      
      if (notificationService.isSupported) {
        const initialized = await notificationService.init();
        setIsInitialized(initialized);
        
        if (initialized) {
          // Check existing permission
          const currentPermission = Notification.permission;
          setPermission(currentPermission);

          // Check existing subscription
          const subscribed = await notificationService.checkAndRenewSubscription();
          setIsSubscribed(subscribed);
        }
      }
    } catch (err) {
      console.error('Push notification initialization failed:', err);
    }
  };

  // Request push permission
  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      console.error('Permission request failed:', err);
      return 'denied';
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported || !isInitialized) return false;
    
    try {
      const result = await notificationService.subscribe(userId);
      setIsSubscribed(!!result);
      return result;
    } catch (err) {
      console.error('Subscription failed:', err);
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!isSupported || !isSubscribed) return false;
    
    try {
      const result = await notificationService.unsubscribe();
      setIsSubscribed(!result);
      return result;
    } catch (err) {
      console.error('Unsubscription failed:', err);
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      initPushNotifications();
    }
  }, [userId]);

  return {
    // Notification states
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    
    // Web push states
    isSupported,
    permission,
    isSubscribed,
    isInitialized,
    subscribe,
    unsubscribe,
    requestPermission
  };
}