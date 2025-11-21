import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, Upload, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/files?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-2 flex justify-between text-sm">
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-gray-300">회사소개</Link>
            <Link to="/notice" className="hover:text-gray-300">공지사항</Link>
            <Link to="/event" className="hover:text-gray-300">이벤트</Link>
          </div>

          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/charge" className="hover:text-gray-300">
                  캐시충전
                </Link>
                <Link to="/mypage" className="hover:text-gray-300">
                  내정보관리
                </Link>
                <Link to="/customer" className="hover:text-gray-300">
                  사은행사
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300">로그인</Link>
                <Link to="/register" className="hover:text-gray-300">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-3xl font-bold">
              <span className="text-blue-600">We</span>
              <span className="text-green-600">DISK</span>
            </h1>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex gap-2">
              <select className="px-4 py-2 border rounded-lg bg-white">
                <option>전체</option>
                <option>제목</option>
                <option>업로더</option>
              </select>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="검색할 파일명, 장르를 입력해 보세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg pr-10"
                />
                <button type="submit" className="absolute right-2 top-2">
                  <Search className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
          </form>

          {/* User info */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium">{user.displayName || user.username} 님</p>
                <div className="flex gap-3 text-xs text-gray-600">
                  <span>{user.cash.toLocaleString()} 캐시</span>
                  <span>{user.point.toLocaleString()} 포인트</span>
                  <span>{user.couponCount} 쿠폰</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/charge')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="캐시충전"
                >
                  <Wallet className="w-5 h-5" />
                </button>
                {user.isSeller && (
                  <button
                    onClick={() => navigate('/upload')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="파일업로드"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => navigate('/mypage')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="마이페이지"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category navigation */}
      <nav className="bg-gray-700 text-white">
        <div className="container mx-auto px-4">
          <ul className="flex gap-1">
            <li>
              <Link to="/files?popular=true" className="block px-4 py-3 hover:bg-gray-600">
                인기100
              </Link>
            </li>
            <li>
              <Link to="/files" className="block px-4 py-3 hover:bg-gray-600">
                전체
              </Link>
            </li>
            <li>
              <Link to="/files?category=movie" className="block px-4 py-3 hover:bg-gray-600">
                영화
              </Link>
            </li>
            <li>
              <Link to="/files?category=drama" className="block px-4 py-3 hover:bg-gray-600">
                드라마
              </Link>
            </li>
            <li>
              <Link to="/files?category=video" className="block px-4 py-3 hover:bg-gray-600">
                동영상
              </Link>
            </li>
            <li>
              <Link to="/files?category=game" className="block px-4 py-3 hover:bg-gray-600">
                게임
              </Link>
            </li>
            <li>
              <Link to="/files?category=anime" className="block px-4 py-3 hover:bg-gray-600">
                애니
              </Link>
            </li>
            <li>
              <Link to="/files?category=book" className="block px-4 py-3 hover:bg-gray-600">
                도서
              </Link>
            </li>
            <li>
              <Link to="/files?category=education" className="block px-4 py-3 hover:bg-gray-600">
                교육
              </Link>
            </li>
            <li>
              <Link to="/files?category=etc" className="block px-4 py-3 hover:bg-gray-600">
                기타
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
