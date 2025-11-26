import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, User, LogOut, Upload, Wallet, Mail, Users,
  Bell, ChevronDown, Gift, Calendar, Smartphone,
  Zap, Crown, BookOpen, Gamepad2, Film, Tv, Music, FileText, Star
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect, useRef } from 'react';
import { messagesApi } from '../api/messages';
import { friendsApi } from '../api/friends';

// 카테고리 데이터 (서브메뉴 포함)
const CATEGORIES = [
  {
    id: 'popular',
    name: '인기100',
    icon: Star,
    color: 'text-yellow-400',
    isSpecial: true,
    path: '/files?popular=true',
  },
  {
    id: 'all',
    name: '전체',
    icon: null,
    path: '/files',
  },
  {
    id: 'movie',
    name: '영화',
    icon: Film,
    subCategories: ['한국영화', '외국영화', '최신영화', '고화질', '시리즈']
  },
  {
    id: 'drama',
    name: '드라마',
    icon: Tv,
    subCategories: ['한국드라마', '미드', '일드', '중드', '넷플릭스']
  },
  {
    id: 'video',
    name: '동영상',
    icon: Music,
    subCategories: ['뮤직비디오', '예능', '다큐멘터리', 'UCC', '스포츠']
  },
  {
    id: 'game',
    name: '게임',
    icon: Gamepad2,
    subCategories: ['PC게임', '온라인게임', '모바일게임', '에뮬레이터', '유틸리티']
  },
  {
    id: 'anime',
    name: '애니',
    icon: null,
    subCategories: ['신작', '완결', '극장판', '특촬', 'OVA']
  },
  {
    id: 'book',
    name: '도서',
    icon: BookOpen,
    subCategories: ['만화', '소설', '잡지', '자기계발', '전문서적']
  },
  {
    id: 'education',
    name: '교육',
    icon: FileText,
    subCategories: ['강의', '자격증', '어학', '초중고', '대학']
  },
  {
    id: 'etc',
    name: '기타',
    icon: null,
    subCategories: ['소프트웨어', '이미지', '템플릿', '기타자료']
  },
];

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
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
                  <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                <Link
                  to="/friends"
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="친구"
                >
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {pendingRequests > 9 ? '9+' : pendingRequests}
                    </span>
                  )}
                </Link>

                {/* 통합 알림 */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    title="알림"
                  >
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    {totalNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </span>
                    )}
                  </button>

                  {/* 알림 드롭다운 */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50">
                      <div className="p-3 border-b dark:border-gray-700">
                        <h3 className="font-bold text-sm dark:text-white">알림</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {unreadMessages > 0 && (
                          <Link
                            to="/messages"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700"
                          >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium dark:text-white">새 쪽지</p>
                              <p className="text-xs text-gray-500">{unreadMessages}개의 읽지 않은 쪽지가 있습니다</p>
                            </div>
                          </Link>
                        )}
                        {pendingRequests > 0 && (
                          <Link
                            to="/friends?tab=received"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium dark:text-white">친구 요청</p>
                              <p className="text-xs text-gray-500">{pendingRequests}개의 친구 요청이 있습니다</p>
                            </div>
                          </Link>
                        )}
                        {totalNotifications === 0 && (
                          <div className="p-6 text-center text-gray-500 text-sm">
                            새로운 알림이 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 기타 버튼 */}
              <div className="flex items-center gap-1 border-l pl-3 dark:border-gray-700">
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
