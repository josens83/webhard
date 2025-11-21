import { Link } from 'react-router-dom';
import { Home, Star, Download, Upload, Heart, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) return null;

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4 sticky top-20">
        {/* User info card */}
        <div className="mb-6 pb-6 border-b">
          <p className="text-lg font-semibold mb-2">{user.username} 님</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">캐시</span>
              <span className="font-medium">{user.cash.toLocaleString()} 개시</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">자동이용권</span>
              <button className="text-blue-600 hover:underline">신청하기</button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">포인트</span>
              <span className="font-medium">{user.point.toLocaleString()} 포인트</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">쿠폰</span>
              <span className="font-medium">{user.couponCount} 개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">별</span>
              <span className="font-medium">{user.stars} 별</span>
            </div>
          </div>

          <Link
            to="/charge"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            캐시충전
          </Link>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          <Link
            to="/mypage"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
          >
            <Home className="w-5 h-5" />
            <span>맵알으로</span>
          </Link>

          <Link
            to="/mypage/received"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
          >
            <Download className="w-5 h-5" />
            <span>받은자료</span>
          </Link>

          <Link
            to="/mypage/favorites"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
          >
            <Heart className="w-5 h-5" />
            <span>편한자료</span>
          </Link>

          {user.isSeller && (
            <Link
              to="/mypage/uploads"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
            >
              <Upload className="w-5 h-5" />
              <span>출린자료</span>
            </Link>
          )}

          <Link
            to="/upload"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
          >
            <Star className="w-5 h-5" />
            <span>자료등록</span>
          </Link>

          <Link
            to="/mypage/settings"
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
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
            <p className="text-xs">친절한 사은행사를 확인하세요</p>
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
