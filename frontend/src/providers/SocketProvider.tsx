import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket, useSocketNotifications, useSocketMessages, useSocketFriends, useUploadProgress, useDownloadProgress } from '../hooks/useSocket';
import { socketService } from '../services/socket.service';

interface SocketContextType {
  isConnected: boolean;
  notifications: {
    items: Array<{ type: string; title: string; message: string; link?: string }>;
    unreadCount: number;
    clear: () => void;
  };
  messages: {
    newCount: number;
    reset: () => void;
  };
  friends: {
    requestCount: number;
    reset: () => void;
  };
  uploads: Array<{ fileId: string; progress: number; fileName: string }>;
  downloads: Array<{ fileId: string; progress: number; fileName: string }>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isConnected } = useSocket();
  const { notifications, unreadCount, clearNotifications } = useSocketNotifications();
  const { newMessageCount, resetMessageCount } = useSocketMessages();
  const { friendRequestCount, resetFriendRequestCount } = useSocketFriends();
  const { uploads } = useUploadProgress();
  const { downloads } = useDownloadProgress();

  const value: SocketContextType = {
    isConnected,
    notifications: {
      items: notifications,
      unreadCount,
      clear: clearNotifications,
    },
    messages: {
      newCount: newMessageCount,
      reset: resetMessageCount,
    },
    friends: {
      requestCount: friendRequestCount,
      reset: resetFriendRequestCount,
    },
    uploads,
    downloads,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}

export { socketService };
