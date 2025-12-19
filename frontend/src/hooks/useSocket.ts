import { useEffect, useCallback, useState } from 'react';
import { socketService, NotificationEvent, MessageEvent, FriendRequestEvent, UploadProgressEvent, DownloadProgressEvent } from '../services/socket.service';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
      setIsConnected(true);
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }

    return () => {
      // Don't disconnect on cleanup - let other components use the socket
    };
  }, [isAuthenticated, token]);

  return { isConnected, socketService };
}

export function useSocketNotifications() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = socketService.on<NotificationEvent>('notification', (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      toast(data.message, {
        icon: getNotificationIcon(data.type),
        duration: 5000,
      });
    });

    return unsubscribe;
  }, []);

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, clearNotifications };
}

export function useSocketMessages() {
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    const unsubscribe = socketService.on<MessageEvent>('message:new', (data) => {
      setNewMessageCount((prev) => prev + 1);
      toast(`${data.senderUsername}님의 새 쪽지: ${data.title}`, {
        icon: '✉️',
        duration: 4000,
      });
    });

    return unsubscribe;
  }, []);

  const resetMessageCount = useCallback(() => {
    setNewMessageCount(0);
  }, []);

  return { newMessageCount, resetMessageCount };
}

export function useSocketFriends() {
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useEffect(() => {
    const unsubscribeRequest = socketService.on<FriendRequestEvent>('friend:request', (data) => {
      setFriendRequestCount((prev) => prev + 1);
      toast(`${data.senderUsername}님이 친구 요청을 보냈습니다.`, {
        icon: '👥',
        duration: 4000,
      });
    });

    const unsubscribeAccepted = socketService.on<{ accepterUsername: string }>('friend:accepted', (data) => {
      toast(`${data.accepterUsername}님이 친구 요청을 수락했습니다.`, {
        icon: '🎉',
        duration: 4000,
      });
    });

    return () => {
      unsubscribeRequest();
      unsubscribeAccepted();
    };
  }, []);

  const resetFriendRequestCount = useCallback(() => {
    setFriendRequestCount(0);
  }, []);

  return { friendRequestCount, resetFriendRequestCount };
}

export function useUploadProgress() {
  const [uploads, setUploads] = useState<Map<string, UploadProgressEvent>>(new Map());

  useEffect(() => {
    const unsubscribe = socketService.on<UploadProgressEvent>('upload:progress', (data) => {
      setUploads((prev) => {
        const newMap = new Map(prev);
        if (data.progress >= 100) {
          newMap.delete(data.fileId);
        } else {
          newMap.set(data.fileId, data);
        }
        return newMap;
      });
    });

    return unsubscribe;
  }, []);

  return { uploads: Array.from(uploads.values()) };
}

export function useDownloadProgress() {
  const [downloads, setDownloads] = useState<Map<string, DownloadProgressEvent>>(new Map());

  useEffect(() => {
    const unsubscribe = socketService.on<DownloadProgressEvent>('download:progress', (data) => {
      setDownloads((prev) => {
        const newMap = new Map(prev);
        if (data.progress >= 100) {
          newMap.delete(data.fileId);
        } else {
          newMap.set(data.fileId, data);
        }
        return newMap;
      });
    });

    return unsubscribe;
  }, []);

  return { downloads: Array.from(downloads.values()) };
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'MESSAGE':
      return '✉️';
    case 'FRIEND':
      return '👥';
    case 'PURCHASE':
      return '💰';
    case 'COMMENT':
      return '💬';
    case 'RATING':
      return '⭐';
    case 'SYSTEM':
      return '🔔';
    default:
      return '📢';
  }
}
