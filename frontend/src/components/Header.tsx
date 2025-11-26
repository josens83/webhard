import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, Upload, Wallet, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user, isAuthenticated, logout, token } = useAuthStore();
  const { totalUnreadCount, initSocket, reset: resetChat } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('전체');
  const [searchScope, setSearchScope] = useState('전체');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // 알림 카운트
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCounts();
      const interval = setInterval(fetchNotificationCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // 외부 클릭 시 알림 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotificationCounts = async () => {
    try {
      const [messagesRes, friendsRes] = await Promise.all([
        messagesApi.getUnreadCount(),
        friendsApi.getCounts(),
      ]);
      setUnreadMessages(messagesRes.data?.unreadCount || 0);
      setPendingRequests(friendsRes.data?.pendingRequestCount || 0);
    } catch (error) {
      // Silently fail
    }
  };

  // Socket 초기화
  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
    }
    return () => {
      if (!isAuthenticated) {
        resetChat();
      }
    };
  }, [isAuthenticated, token, initSocket, resetChat]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchTerm);
      if (searchCategory !== '전체') params.set('category', searchCategory);
      if (searchScope !== '전체') params.set('scope', searchScope);
      navigate(`/files?${params.toString()}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalNotifications = unreadMessages + pendingRequests;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      {/* Top utility bar (LNB 스타일) */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-1.5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link to="/charge" className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition">
                  <Wallet className="w-3 h-3" />
                  <span>캐시충전</span>
                </Link>
                <span className="text-gray-500">|</span>
                <Link to="/mypage" className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition">
                  <User className="w-3 h-3" />
                  <span>내정보</span>
                </Link>
                <span className="text-gray-500">|</span>
                <Link to="/event" className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition">
                  <Gift className="w-3 h-3" />
                  <span>사은행사</span>
                  <span className="bg-red-500 text-[10px] px-1 rounded ml-1">HOT</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2 py-1 hover:bg-white/10 rounded transition">로그인</Link>
                <span className="text-gray-500">|</span>
                <Link to="/register" className="px-2 py-1 hover:bg-white/10 rounded transition">회원가입</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Link to="/mobile" className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition">
              <Smartphone className="w-3 h-3" />
              <span>모바일</span>
            </Link>
            <span className="text-gray-500">|</span>
            <Link to="/attendance" className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition">
              <Calendar className="w-3 h-3" />
              <span>출석체크</span>
            </Link>
            <span className="text-gray-500">|</span>
            <Link to="/free-charge" className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>무료충전소</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-blue-600">Edu</span>
              <span className="text-emerald-600">Vault</span>
            </h1>
          </Link>

          {/* Search bar (wedisk 스타일) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex border-2 border-blue-500 rounded-lg overflow-hidden">
              {/* 카테고리 선택 */}
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-r text-sm focus:outline-none cursor-pointer"
              >
                <option value="전체">전체</option>
                {CATEGORIES.filter(c => c.id !== 'popular' && c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* 검색 범위 */}
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-r text-sm focus:outline-none cursor-pointer"
              >
                <option value="전체">전체</option>
                <option value="제목">제목</option>
                <option value="등록자">등록자</option>
                <option value="키워드">키워드</option>
              </select>

              {/* 검색 입력 */}
              <input
                type="text"
                placeholder="검색할 파일명, 장르를 입력해 보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 focus:outline-none dark:bg-gray-800 dark:text-white"
              />

              {/* 검색 버튼 */}
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">검색</span>
              </button>
            </div>
          </form>

          {/* User section */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* 사용자 정보 요약 */}
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium dark:text-white">
                  {user.displayName || user.username} 님
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="text-blue-600 font-medium">{user.cash.toLocaleString()}캐시</span>
                  <span>|</span>
                  <span>{user.point.toLocaleString()}P</span>
                </div>
              </div>

              {/* 쪽지/친구/알림 */}
              <div className="flex items-center gap-1">
                <Link
                  to="/messages"
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="쪽지함"
                >
                  <Wallet className="w-5 h-5" />
                </button>
                {/* 채팅 버튼 */}
                <button
                  onClick={() => navigate('/chat')}
                  className="p-2 hover:bg-gray-100 rounded-lg relative"
                  title="메시지"
                >
                  <MessageCircle className="w-5 h-5" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </button>
                {user.isSeller && (
                  <button
                    onClick={() => navigate('/upload')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    title="파일업로드"
                  >
                    <Upload className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
                로그인
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Category navigation (GNB) */}
      <nav className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <ul className="flex">
            {CATEGORIES.map((category) => (
              <li
                key={category.id}
                className="relative"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={category.path || `/files?category=${category.id}`}
                  className={`
                    flex items-center gap-1.5 px-4 py-3 hover:bg-white/10 transition text-sm font-medium
                    ${category.isSpecial ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500' : ''}
                    ${location.search.includes(`category=${category.id}`) ? 'bg-white/20' : ''}
                  `}
                >
                  {category.icon && <category.icon className={`w-4 h-4 ${category.color || ''}`} />}
                  <span>{category.name}</span>
                  {category.subCategories && <ChevronDown className="w-3 h-3 opacity-60" />}
                </Link>

                {/* 서브메뉴 드롭다운 */}
                {category.subCategories && hoveredCategory === category.id && (
                  <div className="absolute top-full left-0 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-b-lg overflow-hidden z-50 border-t-2 border-blue-500">
                    {category.subCategories.map((sub, idx) => (
                      <Link
                        key={idx}
                        to={`/files?category=${category.id}&sub=${encodeURIComponent(sub)}`}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 transition"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}

            {/* 프리미엄 링크 */}
            <li className="ml-auto">
              <Link
                to="/premium"
                className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition text-sm font-medium"
              >
                <Crown className="w-4 h-4" />
                <span>프리미엄</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
