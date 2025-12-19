import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, FileText, Star, Calendar, Mail, UserPlus, Ban, Flag, Award } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  stats: {
    uploads: number;
    totalDownloads: number;
    totalRatings: number;
    averageRating: number;
  };
  recentFiles: Array<{
    id: string;
    title: string;
    thumbnail?: string;
    price: number;
    downloads: number;
    rating: number;
    createdAt: string;
  }>;
  isFriend: boolean;
  isBlocked: boolean;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      setProfile(response.data);
    } catch (error) {
      toast.error('사용자 프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/friends/requests', { userId });
      toast.success('친구 요청을 보냈습니다.');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '친구 요청에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!isAuthenticated) return;
    setActionLoading(true);
    try {
      if (profile?.isBlocked) {
        await api.post(`/friends/${userId}/unblock`);
        toast.success('차단을 해제했습니다.');
      } else {
        await api.post(`/friends/${userId}/block`);
        toast.success('사용자를 차단했습니다.');
      }
      fetchProfile();
    } catch (error) {
      toast.error('작업에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    // Navigate to messages with pre-filled recipient
    window.location.href = `/messages?to=${userId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">사용자를 찾을 수 없습니다</h2>
        <p className="text-gray-500">존재하지 않거나 탈퇴한 사용자입니다.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.displayName || profile.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.displayName || profile.username}
              </h1>
              {profile.stats.averageRating >= 4.5 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  우수 판매자
                </span>
              )}
            </div>

            <p className="text-gray-500 text-sm mb-3">@{profile.username}</p>

            {profile.bio && (
              <p className="text-gray-600 mb-4">{profile.bio}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(profile.createdAt).toLocaleDateString('ko-KR')} 가입
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && isAuthenticated && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSendMessage}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                쪽지 보내기
              </button>
              {!profile.isFriend && !profile.isBlocked && (
                <button
                  onClick={handleFriendRequest}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  친구 추가
                </button>
              )}
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                {profile.isBlocked ? '차단 해제' : '차단'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{profile.stats.uploads}</p>
          <p className="text-sm text-gray-500">업로드</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{profile.stats.totalDownloads.toLocaleString()}</p>
          <p className="text-sm text-gray-500">총 다운로드</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{profile.stats.averageRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">평균 평점</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{profile.stats.totalRatings}</p>
          <p className="text-sm text-gray-500">총 리뷰</p>
        </div>
      </div>

      {/* Recent Files */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">최근 업로드</h2>

        {profile.recentFiles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>업로드한 파일이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.recentFiles.map((file) => (
              <Link
                key={file.id}
                to={`/files/${file.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.title}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate">{file.title}</h3>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-blue-600 font-bold">
                      {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
                    </span>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {file.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
