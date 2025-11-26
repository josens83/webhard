import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import NotificationToast from './NotificationToast';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      <Header />

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>

          {/* Right sidebar - 광고/프로모션 영역 */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-4">
              {/* 프로모션 배너 */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                <p className="text-xs font-medium opacity-80">EVENT</p>
                <p className="font-bold mt-1">신규가입 혜택</p>
                <p className="text-sm mt-2 opacity-90">지금 가입하면 3,000 포인트!</p>
                <button className="mt-3 w-full bg-white/20 hover:bg-white/30 py-2 rounded text-sm font-medium transition">
                  자세히 보기
                </button>
              </div>

              {/* 실시간 인기 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 dark:text-white">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  실시간 인기
                </h3>
                <ol className="space-y-2 text-sm">
                  {['최신 영화 모음', '인기 드라마', '게임 추천', '교육 자료'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 dark:text-gray-300">
                      <span className={`font-bold ${i < 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {i + 1}
                      </span>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 광고 배너 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="aspect-[4/3] bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white">
                  <div className="text-center">
                    <p className="text-2xl font-bold">AD</p>
                    <p className="text-xs opacity-80">광고 영역</p>
                  </div>
                </div>
              </div>

              {/* 고객센터 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-bold text-sm mb-2 dark:text-white">고객센터</h3>
                <p className="text-2xl font-bold text-blue-600">1588-0000</p>
                <p className="text-xs text-gray-500 mt-1">평일 09:00 ~ 18:00</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />

      {/* 플로팅 알림 */}
      <NotificationToast />
    </div>
  );
}
