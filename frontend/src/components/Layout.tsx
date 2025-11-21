import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />

          <main className="flex-1">
            <Outlet />
          </main>

          {/* Right sidebar for ads */}
          <aside className="hidden lg:block w-64">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <img
                  src="/ads/banner1.png"
                  alt="광고"
                  className="w-full rounded"
                />
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <img
                  src="/ads/banner2.png"
                  alt="광고"
                  className="w-full rounded"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
