import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Files, DollarSign, Clock, Check, X, Eye, Search, Filter, ChevronDown, AlertTriangle, Ban, Shield, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

type AdminTab = 'dashboard' | 'files' | 'users' | 'reports';

interface PendingFile {
  id: string;
  title: string;
  description: string;
  category: { name: string };
  uploader: { id: string; username: string; email: string };
  fileSize: number;
  price: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isSeller: boolean;
  isActive: boolean;
  cash: number;
  point: number;
  createdAt: string;
  _count: {
    files: number;
    purchases: number;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'seller' | 'admin'>('all');
  const queryClient = useQueryClient();

  // Dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data.data || response.data;
    },
  });

  // Pending files
  const { data: pendingFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ['pendingFiles'],
    queryFn: async () => {
      const response = await api.get('/admin/files/pending');
      return response.data.files || response.data;
    },
    enabled: activeTab === 'files' || activeTab === 'dashboard',
  });

  // Users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers', userSearch, userFilter],
    queryFn: async () => {
      const params: any = {};
      if (userSearch) params.search = userSearch;
      if (userFilter !== 'all') params.filter = userFilter;
      const response = await api.get('/admin/users', { params });
      return response.data.users || response.data;
    },
    enabled: activeTab === 'users',
  });

  // File approval mutation
  const approveFileMutation = useMutation({
    mutationFn: async ({ fileId, approved, reason }: { fileId: string; approved: boolean; reason?: string }) => {
      const endpoint = approved ? `/admin/files/${fileId}/approve` : `/admin/files/${fileId}/reject`;
      return api.post(endpoint, { reason });
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? '파일이 승인되었습니다.' : '파일이 거부되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['pendingFiles'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: () => {
      toast.error('작업에 실패했습니다.');
    },
  });

  // User action mutation
  const userActionMutation = useMutation({
    mutationFn: async ({ userId, action, value }: { userId: string; action: string; value?: boolean }) => {
      return api.patch(`/admin/users/${userId}`, { [action]: value });
    },
    onSuccess: () => {
      toast.success('사용자 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: () => {
      toast.error('작업에 실패했습니다.');
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const tabs = [
    { key: 'dashboard', label: '대시보드', icon: TrendingUp },
    { key: 'files', label: '파일 관리', icon: Files },
    { key: 'users', label: '사용자 관리', icon: Users },
    { key: 'reports', label: '신고 관리', icon: AlertTriangle },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          관리자 대시보드
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">총 사용자</p>
                      <p className="text-3xl font-bold mt-1">{stats?.totalUsers?.toLocaleString() || 0}</p>
                    </div>
                    <Users className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">총 파일</p>
                      <p className="text-3xl font-bold mt-1">{stats?.totalFiles?.toLocaleString() || 0}</p>
                    </div>
                    <Files className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">총 매출</p>
                      <p className="text-3xl font-bold mt-1">{(stats?.totalRevenue || 0).toLocaleString()}원</p>
                    </div>
                    <DollarSign className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">승인 대기</p>
                      <p className="text-3xl font-bold mt-1">{stats?.pendingFiles || 0}</p>
                    </div>
                    <Clock className="w-12 h-12 opacity-80" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-4">최근 가입 사용자</h2>
                  <div className="space-y-3">
                    {stats?.recentUsers?.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <span className="text-sm text-gray-400">
                          {format(new Date(user.createdAt), 'MM.dd HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Files Preview */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-4">승인 대기 파일</h2>
                  <div className="space-y-3">
                    {pendingFiles?.slice(0, 5).map((file: PendingFile) => (
                      <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.title}</p>
                          <p className="text-sm text-gray-500">@{file.uploader.username}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => approveFileMutation.mutate({ fileId: file.id, approved: true })}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => approveFileMutation.mutate({ fileId: file.id, approved: false })}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!pendingFiles || pendingFiles.length === 0) && (
                      <p className="text-center text-gray-500 py-4">대기 중인 파일이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <h2 className="text-xl font-bold mb-4">승인 대기 파일</h2>
              {loadingFiles ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : pendingFiles?.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Files className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>승인 대기 중인 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingFiles?.map((file: PendingFile) => (
                    <div key={file.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{file.title}</h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {file.category?.name || '미분류'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{file.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <Link
                              to={`/users/${file.uploader.id}`}
                              className="hover:text-blue-500"
                            >
                              @{file.uploader.username}
                            </Link>
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span className="text-blue-600 font-medium">
                              {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
                            </span>
                            <span>{format(new Date(file.createdAt), 'yyyy.MM.dd HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => approveFileMutation.mutate({ fileId: file.id, approved: true })}
                            disabled={approveFileMutation.isPending}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            승인
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('거부 사유를 입력하세요:');
                              if (reason !== null) {
                                approveFileMutation.mutate({ fileId: file.id, approved: false, reason });
                              }
                            }}
                            disabled={approveFileMutation.isPending}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            거부
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="이메일 또는 사용자명 검색"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="seller">판매자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              {loadingUsers ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">사용자</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">역할</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">파일/구매</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">잔액</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">상태</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">가입일</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users?.map((user: User) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <Link to={`/users/${user.id}`} className="font-medium hover:text-blue-500">
                                {user.username}
                              </Link>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {user.isAdmin && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">관리자</span>
                              )}
                              {user.isSeller && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">판매자</span>
                              )}
                              {!user.isAdmin && !user.isSeller && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">일반</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {user._count?.files || 0} / {user._count?.purchases || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            <span className="text-blue-600">{user.cash?.toLocaleString() || 0}C</span>
                            {' / '}
                            <span className="text-green-600">{user.point?.toLocaleString() || 0}P</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.isActive ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">활성</span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">비활성</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {format(new Date(user.createdAt), 'yy.MM.dd')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => userActionMutation.mutate({
                                  userId: user.id,
                                  action: 'isSeller',
                                  value: !user.isSeller
                                })}
                                className={`p-1.5 rounded ${user.isSeller ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} hover:opacity-80`}
                                title={user.isSeller ? '판매자 권한 해제' : '판매자 권한 부여'}
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => userActionMutation.mutate({
                                  userId: user.id,
                                  action: 'isActive',
                                  value: !user.isActive
                                })}
                                className={`p-1.5 rounded ${user.isActive ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-600'} hover:opacity-80`}
                                title={user.isActive ? '계정 비활성화' : '계정 활성화'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="text-center py-20 text-gray-500">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>신고 관리 기능은 준비 중입니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
