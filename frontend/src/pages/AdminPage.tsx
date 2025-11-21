import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Users, Files, DollarSign, Clock } from 'lucide-react';

export default function AdminPage() {
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">관리자 대시보드</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 사용자</p>
              <p className="text-3xl font-bold">{stats?.data?.totalUsers || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 파일</p>
              <p className="text-3xl font-bold">{stats?.data?.totalFiles || 0}</p>
            </div>
            <Files className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 매출</p>
              <p className="text-3xl font-bold">{(stats?.data?.totalRevenue || 0).toLocaleString()}원</p>
            </div>
            <DollarSign className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-3xl font-bold">{stats?.data?.pendingFiles || 0}</p>
            </div>
            <Clock className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">최근 가입 사용자</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">이메일</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">아이디</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.data?.recentUsers?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.username}</td>
                  <td className="px-6 py-4 text-center">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
