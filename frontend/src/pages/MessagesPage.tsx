import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Send,
  Inbox,
  Trash2,
  Reply,
  CheckCircle,
  Circle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, Message, MessageListResponse } from '../api/messages';
import { friendsApi, Friend } from '../api/friends';
import { useAuthStore } from '../store/authStore';

type TabType = 'inbox' | 'sent';

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'inbox'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Compose modal state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeReceiver, setComposeReceiver] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // Friend list for autocomplete
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showFriendList, setShowFriendList] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchFriends();
  }, [activeTab, pagination.page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let response: MessageListResponse;
      if (activeTab === 'inbox') {
        response = await messagesApi.getInbox(pagination.page, pagination.limit);
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        response = await messagesApi.getSent(pagination.page, pagination.limit);
      }
      setMessages(response.data.messages);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await friendsApi.getFriends();
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSelectedMessage(null);
    setSelectedIds([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (activeTab === 'inbox' && !message.isRead) {
      try {
        await messagesApi.get(message.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map((m) => m.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개의 쪽지를 삭제하시겠습니까?`)) return;

    try {
      await messagesApi.deleteMany(selectedIds, activeTab);
      toast.success(`${selectedIds.length}개의 쪽지가 삭제되었습니다.`);
      setSelectedIds([]);
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete messages:', error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('쪽지를 삭제하시겠습니까?')) return;

    try {
      await messagesApi.delete(id);
      toast.success('쪽지가 삭제되었습니다.');
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await messagesApi.markAllAsRead();
      toast.success('모든 쪽지를 읽음 처리했습니다.');
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!composeReceiver.trim() || !composeContent.trim()) {
      toast.error('받는 사람과 내용을 입력해주세요.');
      return;
    }

    setComposeSending(true);
    try {
      await messagesApi.send({
        receiverUsername: composeReceiver,
        content: composeContent,
      });
      toast.success('쪽지를 전송했습니다.');
      setShowComposeModal(false);
      setComposeReceiver('');
      setComposeContent('');
      if (activeTab === 'sent') {
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setComposeSending(false);
    }
  };

  const handleReply = (message: Message) => {
    const sender = message.sender;
    if (sender) {
      setComposeReceiver(sender.username);
      setShowComposeModal(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">쪽지함</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowComposeModal(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              쪽지 보내기
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-gray-700 flex">
          <button
            onClick={() => handleTabChange('inbox')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'inbox'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Inbox className="w-4 h-4" />
              받은 쪽지
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange('sent')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'sent'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              보낸 쪽지
            </div>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === messages.length && messages.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">전체 선택</span>
            </label>
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                선택 삭제 ({selectedIds.length})
              </button>
            )}
          </div>
          {activeTab === 'inbox' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              모두 읽음
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex min-h-[500px]">
          {/* Message List */}
          <div className="w-1/2 border-r dark:border-gray-700">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="w-16 h-16 mb-4 opacity-30" />
                <p>{activeTab === 'inbox' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.'}</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {messages.map((message) => {
                  const otherUser = activeTab === 'inbox' ? message.sender : message.receiver;
                  return (
                    <div
                      key={message.id}
                      onClick={() => handleSelectMessage(message)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                        selectedMessage?.id === message.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                      } ${!message.isRead && activeTab === 'inbox' ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(message.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(message.id);
                          }}
                          className="mt-1 rounded"
                        />
                        <div className="flex-shrink-0">
                          {!message.isRead && activeTab === 'inbox' ? (
                            <Circle className="w-3 h-3 text-blue-500 fill-blue-500" />
                          ) : (
                            <Circle className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium truncate ${!message.isRead && activeTab === 'inbox' ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                              {otherUser?.displayName || otherUser?.username || '알 수 없음'}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t dark:border-gray-700 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="w-1/2 p-6">
            {selectedMessage ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activeTab === 'inbox'
                          ? selectedMessage.sender?.displayName || selectedMessage.sender?.username
                          : selectedMessage.receiver?.displayName || selectedMessage.receiver?.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'inbox' && (
                      <button
                        onClick={() => handleReply(selectedMessage)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="답장"
                      >
                        <Reply className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="border-t dark:border-gray-700 pt-4">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>
                {selectedMessage.isRead && selectedMessage.readAt && activeTab === 'sent' && (
                  <p className="text-xs text-gray-500 mt-4">
                    읽음: {new Date(selectedMessage.readAt).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Mail className="w-16 h-16 mb-4 opacity-30" />
                <p>쪽지를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">쪽지 보내기</h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  받는 사람
                </label>
                <input
                  type="text"
                  value={composeReceiver}
                  onChange={(e) => setComposeReceiver(e.target.value)}
                  onFocus={() => setShowFriendList(true)}
                  placeholder="아이디를 입력하세요"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                />
                {showFriendList && friends.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {friends
                      .filter(
                        (f) =>
                          f.friend.username.toLowerCase().includes(composeReceiver.toLowerCase()) ||
                          f.friend.displayName?.toLowerCase().includes(composeReceiver.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((friend) => (
                        <button
                          key={friend.id}
                          onClick={() => {
                            setComposeReceiver(friend.friend.username);
                            setShowFriendList(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span>{friend.nickname || friend.friend.displayName || friend.friend.username}</span>
                          <span className="text-xs text-gray-500">@{friend.friend.username}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  내용
                </label>
                <textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="쪽지 내용을 입력하세요"
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {composeContent.length} / 1000
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={handleSendMessage}
                disabled={composeSending || !composeReceiver.trim() || !composeContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {composeSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    보내기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
