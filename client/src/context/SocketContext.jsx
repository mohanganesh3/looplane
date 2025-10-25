import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: {
          userId: user._id
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Online users list
      newSocket.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      // User came online
      newSocket.on('user:online', (userId) => {
        setOnlineUsers(prev => [...new Set([...prev, userId])]);
      });

      // User went offline
      newSocket.on('user:offline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user?._id]);

  // Join a chat room
  const joinRoom = useCallback((roomId) => {
    if (socket && isConnected) {
      socket.emit('room:join', roomId);
    }
  }, [socket, isConnected]);

  // Leave a chat room
  const leaveRoom = useCallback((roomId) => {
    if (socket && isConnected) {
      socket.emit('room:leave', roomId);
    }
  }, [socket, isConnected]);

  // Send a message
  const sendMessage = useCallback((roomId, message) => {
    if (socket && isConnected) {
      socket.emit('message:send', { roomId, message });
    }
  }, [socket, isConnected]);

  // Mark messages as read
  const markAsRead = useCallback((roomId) => {
    if (socket && isConnected) {
      socket.emit('message:read', { roomId });
    }
  }, [socket, isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((roomId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('user:typing', { roomId, isTyping });
    }
  }, [socket, isConnected]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    markAsRead,
    sendTyping,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
