import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Search,
  Star,
  StarOff,
  Ban,
  MoreVertical,
  Send,
  X,
  ChevronDown,
  Check,
  Clock,
  Folder,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  friendsApi,
  Friend,
  FriendRequest,
  FriendGroup,
  SearchUserResult,
} from '../api/friends';
import { messagesApi } from '../api/messages';
import { useAuthStore } from '../store/authStore';

type TabType = 'friends' | 'received' | 'sent' | 'blocked';

export default function FriendsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'friends'
  );
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add friend modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<SearchUserResult[]>([]);
  const [addSearching, setAddSearching] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    friend: Friend;
    x: number;
    y: number;
  } | null>(null);

  // Counts
  const [friendCount, setFriendCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [selectedGroup, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const countsResponse = await friendsApi.getCounts();
      setFriendCount(countsResponse.data.friendCount);
      setPendingCount(countsResponse.data.pendingRequestCount);

      switch (activeTab) {
        case 'friends':
          await fetchFriends();
          break;
        case 'received':
          const receivedResponse = await friendsApi.getReceivedRequests();
          setReceivedRequests(receivedResponse.data);
          break;
        case 'sent':
          const sentResponse = await friendsApi.getSentRequests();
          setSentRequests(sentResponse.data);
          break;
        case 'blocked':
          const blockedResponse = await friendsApi.getBlockedUsers();
          setBlockedUsers(blockedResponse.data);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await friendsApi.getFriends(selectedGroup, searchQuery);
      setFriends(response.data.friends);
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSearchUsers = async () => {
    if (addSearchQuery.length < 2) {
      toast.error('검색어는 2자 이상 입력해주세요.');
      return;
    }

    setAddSearching(true);
    try {
      const response = await friendsApi.searchUsers(addSearchQuery);
      setAddSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setAddSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendsApi.sendRequest(userId);
      toast.success('친구 요청을 보냈습니다.');
      setAddSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'requested' as const } : u))
      );
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsApi.acceptRequest(requestId);
      toast.success('친구 요청을 수락했습니다.');
      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPendingCount((prev) => prev - 1);
      setFriendCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendsApi.rejectRequest(requestId);
      toast.success('친구 요청을 거절했습니다.');
      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPendingCount((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendsApi.cancelRequest(requestId);
      toast.success('친구 요청을 취소했습니다.');
      setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('친구를 삭제하시겠습니까?')) return;
    try {
      await friendsApi.removeFriend(friendId);
      toast.success('친구를 삭제했습니다.');
      setFriends((prev) => prev.filter((f) => f.friendId !== friendId));
      setFriendCount((prev) => prev - 1);
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleBlockFriend = async (friendId: string) => {
    if (!window.confirm('이 사용자를 차단하시겠습니까?')) return;
    try {
      await friendsApi.blockFriend(friendId);
      toast.success('사용자를 차단했습니다.');
      fetchData();
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handleUnblockFriend = async (friendId: string) => {
    try {
      await friendsApi.unblockFriend(friendId);
      toast.success('차단을 해제했습니다.');
      setBlockedUsers((prev) => prev.filter((f) => f.friendId !== friendId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  const handleToggleFavorite = async (friendId: string) => {
    try {
      await friendsApi.toggleFavorite(friendId);
      setFriends((prev) =>
        prev.map((f) =>
          f.friendId === friendId ? { ...f, isFavorite: !f.isFavorite } : f
        )
      );
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleSendMessage = async (username: string) => {
    // This would open the message compose modal with the username pre-filled
    // For now, just navigate to messages page
    window.location.href = `/messages?compose=${username}`;
  };

  const handleContextMenu = (e: React.MouseEvent, friend: Friend) => {
    e.preventDefault();
    setContextMenu({
      friend,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">친구 관리</h1>
              <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">
                {friendCount}명
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              친구 추가
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-gray-700 flex">
          <button
            onClick={() => handleTabChange('friends')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'friends'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              친구 목록
            </div>
          </button>
          <button
            onClick={() => handleTabChange('received')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'received'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4" />
              받은 요청
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange('sent')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'sent'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              보낸 요청
            </div>
          </button>
          <button
            onClick={() => handleTabChange('blocked')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'blocked'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Ban className="w-4 h-4" />
              차단 목록
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="flex">
              {/* Groups sidebar */}
              <div className="w-48 border-r dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">그룹</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedGroup('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      selectedGroup === ''
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    전체 ({friendCount})
                  </button>
                  {groups.map((group) => (
                    <button
                      key={group.name}
                      onClick={() => setSelectedGroup(group.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        selectedGroup === group.name
                          ? 'bg-green-50 text-green-600 dark:bg-green-900/20'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Folder className="w-4 h-4" />
                      {group.name} ({group.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Friends list */}
              <div className="flex-1">
                {/* Search */}
                <div className="p-4 border-b dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="친구 검색..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Users className="w-16 h-16 mb-4 opacity-30" />
                    <p>친구가 없습니다.</p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onContextMenu={(e) => handleContextMenu(e, friend)}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              {friend.friend.avatar ? (
                                <img
                                  src={friend.friend.avatar}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            {friend.isFavorite && (
                              <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friend.nickname || friend.friend.displayName || friend.friend.username}
                              {friend.nickname && (
                                <span className="text-xs text-gray-500 ml-2">
                                  @{friend.friend.username}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {friend.groupName || '기본'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSendMessage(friend.friend.username)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="쪽지 보내기"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleContextMenu(e, friend)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Received Requests Tab */}
          {activeTab === 'received' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <UserCheck className="w-16 h-16 mb-4 opacity-30" />
                  <p>받은 친구 요청이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.requester?.displayName || request.requester?.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(request.createdAt)}
                          </p>
                          {request.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          수락
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sent Requests Tab */}
          {activeTab === 'sent' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Clock className="w-16 h-16 mb-4 opacity-30" />
                  <p>보낸 친구 요청이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.receiver?.displayName || request.receiver?.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(request.createdAt)} - 대기 중
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        취소
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blocked Tab */}
          {activeTab === 'blocked' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Ban className="w-16 h-16 mb-4 opacity-30" />
                  <p>차단한 사용자가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {blocked.friend.displayName || blocked.friend.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockFriend(blocked.friendId)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      >
                        차단 해제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleToggleFavorite(contextMenu.friend.friendId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            {contextMenu.friend.isFavorite ? (
              <>
                <StarOff className="w-4 h-4" />
                즐겨찾기 해제
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                즐겨찾기
              </>
            )}
          </button>
          <button
            onClick={() => handleSendMessage(contextMenu.friend.friend.username)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            쪽지 보내기
          </button>
          <button
            onClick={() => handleBlockFriend(contextMenu.friend.friendId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
          >
            <Ban className="w-4 h-4" />
            차단하기
          </button>
          <button
            onClick={() => handleRemoveFriend(contextMenu.friend.friendId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
          >
            <UserMinus className="w-4 h-4" />
            친구 삭제
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">친구 추가</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddSearchQuery('');
                  setAddSearchResults([]);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  placeholder="아이디 또는 닉네임으로 검색"
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={addSearching}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {addSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>

              {addSearchResults.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {addSearchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                      {user.status === 'friend' ? (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          친구
                        </span>
                      ) : user.status === 'requested' ? (
                        <span className="text-sm text-gray-500">요청됨</span>
                      ) : user.status === 'pending' ? (
                        <button
                          onClick={() => {
                            // Accept the pending request
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                        >
                          수락
                        </button>
                      ) : user.status === 'blocked' ? (
                        <span className="text-sm text-red-600">차단됨</span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          요청
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : addSearchQuery && !addSearching ? (
                <div className="text-center py-8 text-gray-500">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
