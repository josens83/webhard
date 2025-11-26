import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Users, X, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { messagesApi } from '../api/messages';
import { friendsApi } from '../api/friends';

interface Notification {
  id: string;
  type: 'message' | 'friend_request';
  title: string;
  content: string;
  link: string;
  timestamp: Date;
}

export default function NotificationToast() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastCounts, setLastCounts] = useState({ messages: 0, friends: 0 });

  useEffect(() => {
    if (!isAuthenticated) return;

    // 초기 로드
    checkForNewNotifications();

    // 주기적 체크 (15초마다)
    const interval = setInterval(checkForNewNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const checkForNewNotifications = async () => {
    try {
      const [messagesRes, friendsRes] = await Promise.all([
        messagesApi.getUnreadCount(),
        friendsApi.getCounts(),
      ]);

      const newMessageCount = messagesRes.data?.unreadCount || 0;
      const newFriendCount = friendsRes.data?.pendingRequestCount || 0;

      // 새 쪽지가 왔을 때
      if (newMessageCount > lastCounts.messages) {
        const diff = newMessageCount - lastCounts.messages;
        addNotification({
          id: `msg-${Date.now()}`,
          type: 'message',
          title: '새 쪽지 도착',
          content: `${diff}개의 새로운 쪽지가 도착했습니다`,
          link: '/messages',
          timestamp: new Date(),
        });
      }

      // 새 친구 요청이 왔을 때
      if (newFriendCount > lastCounts.friends) {
        const diff = newFriendCount - lastCounts.friends;
        addNotification({
          id: `friend-${Date.now()}`,
          type: 'friend_request',
          title: '친구 요청',
          content: `${diff}개의 새로운 친구 요청이 있습니다`,
          link: '/friends?tab=received',
          timestamp: new Date(),
        });
      }

      setLastCounts({ messages: newMessageCount, friends: newFriendCount });
    } catch (error) {
      // Silently fail
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => {
      // 중복 방지 (같은 타입의 알림이 5초 내에 있으면 무시)
      const recentSameType = prev.find(
        (n) => n.type === notification.type &&
        Date.now() - n.timestamp.getTime() < 5000
      );
      if (recentSameType) return prev;

      return [notification, ...prev].slice(0, 5); // 최대 5개
    });

    // 10초 후 자동 제거
    setTimeout(() => {
      removeNotification(notification.id);
    }, 10000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!isAuthenticated || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {!isMinimized ? (
        <>
          {/* 알림 목록 */}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 p-4 w-80 animate-slide-in-right"
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${notification.type === 'message'
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'bg-green-100 dark:bg-green-900'}
                `}>
                  {notification.type === 'message' ? (
                    <Mail className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Users className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm dark:text-white">
                      {notification.title}
                    </p>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{notification.content}</p>
                  <Link
                    to={notification.link}
                    onClick={() => removeNotification(notification.id)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    확인하기
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* 최소화 버튼 */}
          {notifications.length > 0 && (
            <button
              onClick={() => setIsMinimized(true)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
            >
              알림 숨기기
            </button>
          )}
        </>
      ) : (
        /* 최소화된 상태 */
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition relative"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {notifications.length}
          </span>
        </button>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
