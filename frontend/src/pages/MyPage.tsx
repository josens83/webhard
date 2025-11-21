import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Download, Upload, Heart, Wallet } from 'lucide-react';

export default function MyPage() {
  const { user } = useAuthStore();

  const { data: myFiles } = useQuery({
    queryKey: ['myFiles'],
    queryFn: async () => {
      const response = await apiClient.get('/users/my-files');
      return response.data;
    },
  });

  const { data: myPurchases } = useQuery({
    queryKey: ['myPurchases'],
    queryFn: async () => {
      const response = await apiClient.get('/users/my-purchases');
      return response.data;
    },
  });

  const { data: myFavorites } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: async () => {
      const response = await apiClient.get('/users/my-favorites');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* User summary card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">{user?.displayName || user?.username}님의 마이페이지</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">캐시</p>
            <p className="text-2xl font-bold text-blue-600">{user?.cash.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Download className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600">포인트</p>
            <p className="text-2xl font-bold text-green-600">{user?.point.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Heart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">찜한 파일</p>
            <p className="text-2xl font-bold text-purple-600">{myFavorites?.data?.favorites?.length || 0}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Upload className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <p className="text-sm text-gray-600">업로드한 파일</p>
            <p className="text-2xl font-bold text-orange-600">{myFiles?.data?.files?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              구매한 파일
            </button>
            <button className="px-6 py-3 text-gray-600 hover:text-gray-900">
              찜한 파일
            </button>
            <button className="px-6 py-3 text-gray-600 hover:text-gray-900">
              업로드한 파일
            </button>
            <button className="px-6 py-3 text-gray-600 hover:text-gray-900">
              거래 내역
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Purchased files list */}
          <div className="space-y-4">
            {myPurchases?.data?.purchases?.map((purchase: any) => (
              <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h4 className="font-semibold">{purchase.file.title}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    다운로드
                  </button>
                </div>
              </div>
            ))}

            {(!myPurchases?.data?.purchases || myPurchases.data.purchases.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                구매한 파일이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
