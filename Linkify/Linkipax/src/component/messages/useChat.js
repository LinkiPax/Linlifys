import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const useChat = (userId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const typingTimeouts = useRef({});

  // Initialize socket connection with better error handling
  useEffect(() => {
    if (!userId) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false, // We'll manually connect after setting up listeners
    });

    setSocket(newSocket);

    // Connect after setting up the socket
    newSocket.connect();

    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      typingTimeouts.current = {};
      
      // Disconnect socket
      newSocket.disconnect();
    };
  }, [userId]);

  // Authentication and event listeners with better state management
  useEffect(() => {
    if (!socket || !userId) return;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('authenticate', userId);
      console.log('Socket connected');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
    };

    const onStatusChange = ({ userId, isOnline }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [userId]: isOnline
      }));
    };

    const onInitialStatuses = (statuses) => {
      setOnlineStatus(statuses);
    };

    const onTypingStatus = ({ userId, isTyping }) => {
      // Clear previous timeout if exists
      if (typingTimeouts.current[userId]) {
        clearTimeout(typingTimeouts.current[userId]);
        delete typingTimeouts.current[userId];
      }

      setTypingStatus(prev => ({
        ...prev,
        [userId]: isTyping
      }));
      
      // Set timeout to automatically clear typing status
      if (isTyping) {
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingStatus(prev => ({
            ...prev,
            [userId]: false
          }));
          delete typingTimeouts.current[userId];
        }, 3000);
      }
    };

    const onReconnectAttempt = (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    };

    const onReconnectFailed = () => {
      console.error('Reconnection failed');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('user_status_change', onStatusChange);
    socket.on('initial_statuses', onInitialStatuses);
    socket.on('typing_status', onTypingStatus);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect_failed', onReconnectFailed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('user_status_change', onStatusChange);
      socket.off('initial_statuses', onInitialStatuses);
      socket.off('typing_status', onTypingStatus);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect_failed', onReconnectFailed);
    };
  }, [socket, userId]);

  // Enhanced sendMessage with timeout and retry logic
  const sendMessage = useCallback(async (messageData) => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to server');
    }

    // Generate a temporary ID for optimistic updates
    const tempId = Date.now().toString();
    const messageWithTempId = {
      ...messageData,
      tempId
    };

    return new Promise((resolve, reject) => {
      // Set timeout for message sending
      const timeout = setTimeout(() => {
        reject(new Error('Message sending timed out'));
      }, 10000); // 10 second timeout

      socket.emit('send_message', messageWithTempId, (response) => {
        clearTimeout(timeout);
        
        if (response.status === 'error') {
          reject(new Error(response.error));
        } else {
          resolve({
            ...response.message,
            tempId // Include tempId for client-side reconciliation
          });
        }
      });
    });
  }, [socket, isConnected]);

  // Debounced typing indicator
  const setTyping = useCallback((chatId, isTyping) => {
    if (!socket || !isConnected) return;

    // Clear previous typing timeout if exists
    if (typingTimeouts.current[chatId]) {
      clearTimeout(typingTimeouts.current[chatId]);
      delete typingTimeouts.current[chatId];
    }

    // Send typing status immediately
    socket.emit('typing', { 
      chatId, 
      isTyping 
    });

    // Set timeout to automatically stop typing if no further activity
    if (isTyping) {
      typingTimeouts.current[chatId] = setTimeout(() => {
        socket.emit('typing', {
          chatId,
          isTyping: false
        });
        delete typingTimeouts.current[chatId];
      }, 2000); // 2 seconds of inactivity
    }
  }, [socket, isConnected]);

  // Join/leave chat room with cleanup
  const joinChat = useCallback((chatId) => {
    if (!socket || !isConnected) return;

    socket.emit('join_chat', chatId);
    
    // Return cleanup function to leave chat
    return () => {
      socket.emit('leave_chat', chatId);
    };
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    onlineStatus,
    typingStatus,
    sendMessage,
    setTyping,
    joinChat
  };
};

export default useChat;