import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Download, Upload, Heart, Wallet, FileText, Star, Clock, Settings, CreditCard, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type TabType = 'purchases' | 'favorites' | 'uploads' | 'history';

interface FileItem {
  id: string;
  title: string;
  thumbnail?: string;
  price: number;
  downloads: number;
  rating: number;
  status?: string;
  createdAt: string;
}

interface Purchase {
  id: string;
  file: FileItem;
  amount: number;
  createdAt: string;
}

interface Favorite {
  id: string;
  file: FileItem;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

export default function MyPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('purchases');

  const { data: myPurchases, isLoading: loadingPurchases } = useQuery({
    queryKey: ['myPurchases'],
    queryFn: async () => {
      const response = await api.get('/users/my-purchases');
      return response.data.data?.purchases || response.data.purchases || [];
    },
    enabled: activeTab === 'purchases',
  });

  const { data: myFavorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: async () => {
      const response = await api.get('/users/my-favorites');
      return response.data.data?.favorites || response.data.favorites || [];
    },
    enabled: activeTab === 'favorites',
  });

  const { data: myFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ['myFiles'],
    queryFn: async () => {
      const response = await api.get('/users/my-files');
      return response.data.data?.files || response.data.files || [];
    },
    enabled: activeTab === 'uploads',
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions'],
    queryFn: async () => {
      const response = await api.get('/payments/transactions', { params: { limit: 20 } });
      return response.data.transactions || response.data || [];
    },
    enabled: activeTab === 'history',
  });

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await api.post(`/files/${fileId}/download`, {}, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('다운로드가 시작되었습니다.');
    } catch (error) {
      toast.error('다운로드에 실패했습니다.');
    }
  };

  const handleRemoveFavorite = async (fileId: string) => {
    try {
      await api.post(`/files/${fileId}/favorite`);
      toast.success('찜 목록에서 삭제되었습니다.');
    } catch (error) {
      toast.error('작업에 실패했습니다.');
    }
  };

  const tabs = [
    { key: 'purchases' as const, label: '구매한 파일', icon: Download, count: myPurchases?.length },
    { key: 'favorites' as const, label: '찜한 파일', icon: Heart, count: user?.stars || 0 },
    { key: 'uploads' as const, label: '업로드한 파일', icon: Upload, count: myFiles?.length },
    { key: 'history' as const, label: '거래 내역', icon: Clock },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">공개</span>;
      case 'PENDING':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">대기중</span>;
      case 'REJECTED':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">거부됨</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{status}</span>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CHARGE':
        return <span className="text-green-600">+</span>;
      case 'PURCHASE':
        return <span className="text-red-600">-</span>;
      case 'SALE':
        return <span className="text-blue-600">+</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* User Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.displayName || user?.username}</h2>
              <p className="text-blue-100">@{user?.username}</p>
            </div>
          </div>
          <Link
            to="/charge"
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            충전하기
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5" />
              <span className="text-blue-100">캐시</span>
            </div>
            <p className="text-2xl font-bold">{user?.cash?.toLocaleString() || 0}C</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5" />
              <span className="text-blue-100">포인트</span>
            </div>
            <p className="text-2xl font-bold">{user?.point?.toLocaleString() || 0}P</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5" />
              <span className="text-blue-100">찜한 파일</span>
            </div>
            <p className="text-2xl font-bold">{user?.stars || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5" />
              <span className="text-blue-100">쿠폰</span>
            </div>
            <p className="text-2xl font-bold">{user?.couponCount || 0}장</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/payment-history" className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <span className="font-medium">결제 내역</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link to="/notifications" className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="font-medium">알림</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link to="/messages" className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="font-medium">쪽지</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
        <Link to="/friends" className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="font-medium">친구 관리</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <>
              {loadingPurchases ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : myPurchases?.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>구매한 파일이 없습니다.</p>
                  <Link to="/files" className="text-blue-500 hover:underline mt-2 inline-block">
                    파일 둘러보기
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPurchases?.map((purchase: Purchase) => (
                    <div key={purchase.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                      {purchase.file.thumbnail ? (
                        <img src={purchase.file.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/files/${purchase.file.id}`} className="font-medium hover:text-blue-500 truncate block">
                          {purchase.file.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          구매일: {format(new Date(purchase.createdAt), 'yyyy.MM.dd')} |
                          {purchase.amount.toLocaleString()}원
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(purchase.file.id, purchase.file.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <>
              {loadingFavorites ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : myFavorites?.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>찜한 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myFavorites?.map((fav: Favorite) => (
                    <div key={fav.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                      {fav.file.thumbnail ? (
                        <img src={fav.file.thumbnail} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/files/${fav.file.id}`} className="font-medium hover:text-blue-500 truncate block">
                          {fav.file.title}
                        </Link>
                        <p className="text-blue-600 font-bold mt-1">
                          {fav.file.price === 0 ? '무료' : `${fav.file.price.toLocaleString()}원`}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {fav.file.rating?.toFixed(1) || '-'}
                          </span>
                          <span>{fav.file.downloads?.toLocaleString() || 0} 다운로드</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(fav.file.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="찜 해제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <>
              {loadingFiles ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : myFiles?.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>업로드한 파일이 없습니다.</p>
                  {user?.isSeller && (
                    <Link to="/upload" className="text-blue-500 hover:underline mt-2 inline-block">
                      파일 업로드하기
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {myFiles?.map((file: FileItem) => (
                    <div key={file.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                      {file.thumbnail ? (
                        <img src={file.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/files/${file.id}`} className="font-medium hover:text-blue-500 truncate">
                            {file.title}
                          </Link>
                          {file.status && getStatusBadge(file.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="text-blue-600 font-medium">
                            {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
                          </span>
                          <span>{file.downloads?.toLocaleString() || 0} 다운로드</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {file.rating?.toFixed(1) || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/files/${file.id}`}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <>
              {loadingTransactions ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : transactions?.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>거래 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions?.slice(0, 10).map((tx: Transaction) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          ['CHARGE', 'SALE', 'BONUS'].includes(tx.type) ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {getTransactionIcon(tx.type)}
                          <span className={`font-bold ${
                            ['CHARGE', 'SALE', 'BONUS'].includes(tx.type) ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'CHARGE' ? 'C' : tx.type === 'PURCHASE' ? 'P' : 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-500">{format(new Date(tx.createdAt), 'yyyy.MM.dd HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          ['CHARGE', 'SALE', 'BONUS'].includes(tx.type) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {['CHARGE', 'SALE', 'BONUS'].includes(tx.type) ? '+' : '-'}{tx.amount.toLocaleString()}원
                        </p>
                        <p className="text-sm text-gray-500">잔액: {tx.balance.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/payment-history"
                    className="block text-center text-blue-500 hover:underline py-4"
                  >
                    전체 거래 내역 보기
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
