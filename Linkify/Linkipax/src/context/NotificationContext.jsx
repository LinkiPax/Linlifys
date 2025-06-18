import React, { createContext, useContext } from "react";
import useNotifications from "../hooks/useNotifications";

export const NotificationContext = createContext();

export function NotificationProvider({ children, userId }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    fetchNotifications,
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
  } = useNotifications(userId);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    fetchNotifications,
    pushSupported: isSupported,
    pushPermission: permission,
    isSubscribed,
    requestPushPermission: requestPermission,
    subscribeToPush: subscribe,
    unsubscribeFromPush: unsubscribe,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
