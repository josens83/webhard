import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Star, Download, Upload, Heart, Settings, Mail, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { messagesApi } from '../api/messages';
import { friendsApi } from '../api/friends';

export default function Sidebar() {
  const { user, isAuthenticated } = useAuthStore();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCounts();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchCounts = async () => {
    try {
      const [messagesRes, friendsRes] = await Promise.all([
        messagesApi.getUnreadCount(),
        friendsApi.getCounts(),
      ]);
      setUnreadMessages(messagesRes.data.unreadCount);
      setFriendCount(friendsRes.data.friendCount);
      setPendingRequests(friendsRes.data.pendingRequestCount);
    } catch (error) {
      // Silently fail if API is not available
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-20">
        {/* User info card */}
        <div className="mb-6 pb-6 border-b dark:border-gray-700">
          <p className="text-lg font-semibold mb-2 dark:text-white">{user.username} 님</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">캐시</span>
              <span className="font-medium dark:text-white">{user.cash.toLocaleString()} 캐시</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">자동이용권</span>
              <button className="text-blue-600 hover:underline">신청하기</button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">포인트</span>
              <span className="font-medium dark:text-white">{user.point.toLocaleString()} 포인트</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">쿠폰</span>
              <span className="font-medium dark:text-white">{user.couponCount} 개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">별</span>
              <span className="font-medium dark:text-white">{user.stars} 별</span>
            </div>
          </div>

          <Link
            to="/charge"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            캐시충전
          </Link>
        </div>

        {/* Communication Section */}
        <div className="mb-4 pb-4 border-b dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">커뮤니케이션</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/messages"
              className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition relative"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">쪽지</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/friends"
              className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition relative"
            >
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">친구 ({friendCount})</span>
              {pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingRequests > 99 ? '99+' : pendingRequests}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          <Link
            to="/mypage"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            <Home className="w-5 h-5" />
            <span>마이페이지</span>
          </Link>

          <Link
            to="/mypage/received"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            <Download className="w-5 h-5" />
            <span>받은자료</span>
          </Link>

          <Link
            to="/mypage/favorites"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            <Heart className="w-5 h-5" />
            <span>찜한자료</span>
          </Link>

          {user.isSeller && (
            <Link
              to="/mypage/uploads"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              <Upload className="w-5 h-5" />
              <span>올린자료</span>
            </Link>
          )}

          <Link
            to="/upload"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            <Star className="w-5 h-5" />
            <span>자료등록</span>
          </Link>

          <Link
            to="/mypage/settings"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            <Settings className="w-5 h-5" />
            <span>고객지원</span>
          </Link>
        </nav>

        {/* Promotional banners */}
        <div className="mt-6 space-y-3">
          <div className="bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg p-4 text-white text-center">
            <p className="text-sm font-bold">1:1영상채팅</p>
            <p className="text-xs">19세 미만 접근 불가</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white text-center">
            <p className="text-sm font-bold">사은행사</p>
            <p className="text-xs">진행중인 사은행사를 확인하세요</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 text-white text-center">
            <p className="text-sm font-bold">무료이용권 등록하기</p>
            <p className="text-xs">100,000 포인트 받아보세요</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
