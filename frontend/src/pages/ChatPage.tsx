import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  Users,
  MoreVertical,
  ArrowLeft,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  X,
  UserPlus,
  LogOut,
  Edit2,
  Trash2,
  Reply,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { chatApi, ChatRoom, Message, User } from '../api/chat';

export default function ChatPage() {
  const { user, token } = useAuthStore();
  const {
    rooms,
    currentRoom,
    messages,
    typingUsers,
    onlineUsers,
    hasMoreMessages,
    nextCursor,
    isLoading,
    totalUnreadCount,
    initSocket,
    setRooms,
    setCurrentRoom,
    setMessages,
    addMessage,
    prependMessages,
    setHasMoreMessages,
    setNextCursor,
    setIsLoading,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    markAsRead,
  } = useChatStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [isMobileListView, setIsMobileListView] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 채팅방 목록 조회
  const { data: roomsData, refetch: refetchRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getChatRooms,
    enabled: !!token,
  });

  // 사용자 검색
  const { data: searchedUsers } = useQuery({
    queryKey: ['searchUsers', userSearchQuery],
    queryFn: () => chatApi.searchUsers(userSearchQuery),
    enabled: userSearchQuery.length >= 2,
  });

  // 메시지 전송
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; replyToId?: string }) =>
      chatApi.sendMessage(currentRoom!.id, data),
    onSuccess: (response) => {
      setMessageInput('');
      setReplyingTo(null);
      inputRef.current?.focus();
    },
    onError: () => {
      toast.error('메시지 전송에 실패했습니다.');
    },
  });

  // 메시지 수정
  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      chatApi.updateMessage(messageId, content),
    onSuccess: () => {
      setEditingMessage(null);
      toast.success('메시지가 수정되었습니다.');
    },
  });

  // 메시지 삭제
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: () => {
      toast.success('메시지가 삭제되었습니다.');
    },
  });

  // 채팅방 생성
  const createRoomMutation = useMutation({
    mutationFn: async () => {
      if (isGroupMode) {
        return chatApi.createGroupChat(groupName, selectedUsers.map((u) => u.id));
      } else {
        return chatApi.createDirectChat(selectedUsers[0].id);
      }
    },
    onSuccess: (response) => {
      setShowNewChat(false);
      setSelectedUsers([]);
      setGroupName('');
      setUserSearchQuery('');
      refetchRooms();
      handleSelectRoom(response.data);
      toast.success(response.message);
    },
    onError: () => {
      toast.error('채팅방 생성에 실패했습니다.');
    },
  });

  // 채팅방 나가기
  const leaveRoomMutation = useMutation({
    mutationFn: () => chatApi.leaveChatRoom(currentRoom!.id),
    onSuccess: () => {
      setCurrentRoom(null);
      setMessages([]);
      refetchRooms();
      toast.success('채팅방을 나갔습니다.');
    },
  });

  // Socket 초기화
  useEffect(() => {
    if (token) {
      initSocket(token);
    }
  }, [token, initSocket]);

  // 채팅방 목록 동기화
  useEffect(() => {
    if (roomsData?.data) {
      setRooms(roomsData.data);
    }
  }, [roomsData, setRooms]);

  // URL 파라미터로 채팅방 선택
  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === roomId);
      if (room && (!currentRoom || currentRoom.id !== roomId)) {
        handleSelectRoom(room);
      }
    }
  }, [searchParams, rooms]);

  // 메시지 목록 끝으로 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 채팅방 선택
  const handleSelectRoom = async (room: ChatRoom) => {
    if (currentRoom?.id) {
      leaveRoom(currentRoom.id);
    }

    setCurrentRoom(room);
    setSearchParams({ room: room.id });
    setIsMobileListView(false);

    // 메시지 로드
    setIsLoading(true);
    try {
      const response = await chatApi.getMessages(room.id);
      setMessages(response.data);
      setHasMoreMessages(response.hasMore);
      setNextCursor(response.nextCursor || null);

      // 소켓 룸 조인
      joinRoom(room.id);

      // 읽음 처리
      markAsRead(room.id);
    } catch (error) {
      toast.error('메시지를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이전 메시지 로드
  const loadMoreMessages = async () => {
    if (!currentRoom || !hasMoreMessages || isLoading) return;

    setIsLoading(true);
    try {
      const response = await chatApi.getMessages(currentRoom.id, nextCursor || undefined);
      prependMessages(response.data);
      setHasMoreMessages(response.hasMore);
      setNextCursor(response.nextCursor || null);
    } catch (error) {
      toast.error('이전 메시지를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 전송
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentRoom) return;

    if (editingMessage) {
      updateMessageMutation.mutate({
        messageId: editingMessage.id,
        content: messageInput,
      });
    } else {
      sendMessageMutation.mutate({
        content: messageInput,
        replyToId: replyingTo?.id,
      });
    }
  };

  // 타이핑 처리
  const handleTyping = () => {
    if (!currentRoom) return;

    startTyping(currentRoom.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentRoom.id);
    }, 2000);
  };

  // 사용자 선택/해제
  const toggleUserSelection = (selectedUser: User) => {
    if (selectedUsers.find((u) => u.id === selectedUser.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== selectedUser.id));
    } else {
      if (isGroupMode || selectedUsers.length === 0) {
        setSelectedUsers([...selectedUsers, selectedUser]);
      } else {
        setSelectedUsers([selectedUser]);
      }
    }
  };

  // 대화 상대 이름 가져오기
  const getRoomName = (room: ChatRoom) => {
    if (room.name) return room.name;
    if (room.type === 'DIRECT') {
      const otherParticipant = room.participants.find((p) => p.userId !== user?.id);
      return otherParticipant?.user.displayName || otherParticipant?.user.username || '알 수 없음';
    }
    return '그룹 채팅';
  };

  // 대화 상대 아바타
  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const otherParticipant = room.participants.find((p) => p.userId !== user?.id);
      return otherParticipant?.user.avatar;
    }
    return null;
  };

  // 필터된 채팅방 목록
  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const roomName = getRoomName(room).toLowerCase();
    return roomName.includes(searchQuery.toLowerCase());
  });

  // 시간 포맷
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
      {/* 채팅방 목록 (왼쪽 사이드바) */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r dark:border-gray-700 flex flex-col ${
          !isMobileListView && 'hidden md:flex'
        }`}
      >
        {/* 헤더 */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">메시지</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <Plus className="w-5 h-5 dark:text-white" />
            </button>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="대화 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm dark:text-white"
            />
          </div>
        </div>

        {/* 채팅방 목록 */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>대화가 없습니다</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                새 대화 시작하기
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                  currentRoom?.id === room.id ? 'bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                {/* 아바타 */}
                <div className="relative">
                  {getRoomAvatar(room) ? (
                    <img
                      src={getRoomAvatar(room)!}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {getRoomName(room)[0]}
                    </div>
                  )}
                  {/* 온라인 상태 */}
                  {room.type === 'DIRECT' && (
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        onlineUsers.has(
                          room.participants.find((p) => p.userId !== user?.id)?.userId || ''
                        )
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-medium dark:text-white truncate">
                      {getRoomName(room)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {room.lastMessageAt && formatTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {room.lastMessage || '대화를 시작해보세요'}
                    </p>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 채팅방 (오른쪽 영역) */}
      <div
        className={`flex-1 flex flex-col ${
          isMobileListView && 'hidden md:flex'
        }`}
      >
        {currentRoom ? (
          <>
            {/* 채팅방 헤더 */}
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
              <button
                onClick={() => {
                  setIsMobileListView(true);
                  setSearchParams({});
                }}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 dark:text-white" />
              </button>

              {/* 아바타 */}
              {getRoomAvatar(currentRoom) ? (
                <img
                  src={getRoomAvatar(currentRoom)!}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {getRoomName(currentRoom)[0]}
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-medium dark:text-white">{getRoomName(currentRoom)}</h3>
                {typingUsers.length > 0 ? (
                  <p className="text-xs text-green-600">
                    {typingUsers.map((u) => u.username).join(', ')} 입력 중...
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRoom.type === 'DIRECT'
                      ? onlineUsers.has(
                          currentRoom.participants.find((p) => p.userId !== user?.id)?.userId || ''
                        )
                        ? '온라인'
                        : '오프라인'
                      : `${currentRoom.participants.length}명 참여`}
                  </p>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowRoomMenu(!showRoomMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <MoreVertical className="w-5 h-5 dark:text-white" />
                </button>

                {showRoomMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10">
                    {currentRoom.type === 'GROUP' && (
                      <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-white">
                        <UserPlus className="w-4 h-4" />
                        참가자 초대
                      </button>
                    )}
                    <button
                      onClick={() => {
                        leaveRoomMutation.mutate();
                        setShowRoomMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      채팅방 나가기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 메시지 목록 */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {hasMoreMessages && (
                <button
                  onClick={loadMoreMessages}
                  disabled={isLoading}
                  className="w-full py-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  {isLoading ? '로딩 중...' : '이전 메시지 보기'}
                </button>
              )}

              {messages.map((message, index) => {
                const isOwn = message.senderId === user?.id;
                const showAvatar =
                  !isOwn &&
                  (index === 0 || messages[index - 1].senderId !== message.senderId);

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* 상대방 아바타 */}
                    {!isOwn && (
                      <div className="w-8">
                        {showAvatar && (
                          message.sender.avatar ? (
                            <img
                              src={message.sender.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                              {(message.sender.displayName || message.sender.username)[0]}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className={`max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
                      {/* 발신자 이름 */}
                      {!isOwn && showAvatar && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {message.sender.displayName || message.sender.username}
                        </p>
                      )}

                      {/* 답장 대상 */}
                      {message.replyTo && (
                        <div className="mb-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400 border-l-2 border-blue-500">
                          <span className="font-medium">
                            {message.replyTo.sender?.displayName}
                          </span>
                          : {message.replyTo.content.slice(0, 50)}
                          {message.replyTo.content.length > 50 && '...'}
                        </div>
                      )}

                      {/* 메시지 내용 */}
                      <div
                        className={`group relative px-4 py-2 rounded-2xl ${
                          message.messageType === 'SYSTEM'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-center text-sm'
                            : isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                        }`}
                      >
                        {message.isDeleted ? (
                          <p className="italic text-gray-400">삭제된 메시지입니다</p>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            {message.isEdited && (
                              <span className="text-xs opacity-70">(수정됨)</span>
                            )}
                          </>
                        )}

                        {/* 메시지 액션 버튼 */}
                        {!message.isDeleted && message.messageType !== 'SYSTEM' && (
                          <div
                            className={`absolute ${
                              isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                            } top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 px-2`}
                          >
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              title="답장"
                            >
                              <Reply className="w-4 h-4 text-gray-500" />
                            </button>
                            {isOwn && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMessage(message);
                                    setMessageInput(message.content);
                                  }}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                  title="수정"
                                >
                                  <Edit2 className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => deleteMessageMutation.mutate(message.id)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                  title="삭제"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 시간 및 읽음 표시 */}
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                          isOwn ? 'justify-end' : ''
                        }`}
                      >
                        <span>{formatTime(message.createdAt)}</span>
                        {isOwn && (
                          <CheckCheck className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* 답장/수정 표시 */}
            {(replyingTo || editingMessage) && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-blue-600 font-medium">
                    {editingMessage ? '메시지 수정 중' : '답장 중'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {(editingMessage || replyingTo)?.content}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setEditingMessage(null);
                    setMessageInput('');
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 메시지 입력 */}
            <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full dark:text-white"
                />
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          // 채팅방 미선택 상태
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">대화를 선택하세요</p>
              <p className="text-sm mt-2">왼쪽에서 대화를 선택하거나 새 대화를 시작하세요</p>
            </div>
          </div>
        )}
      </div>

      {/* 새 대화 모달 */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold dark:text-white">새 대화</h3>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSelectedUsers([]);
                  setGroupName('');
                  setUserSearchQuery('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="p-4">
              {/* 모드 선택 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setIsGroupMode(false);
                    setSelectedUsers([]);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    !isGroupMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  1:1 대화
                </button>
                <button
                  onClick={() => setIsGroupMode(true)}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    isGroupMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  그룹 대화
                </button>
              </div>

              {/* 그룹 이름 입력 */}
              {isGroupMode && (
                <input
                  type="text"
                  placeholder="그룹 이름"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 mb-4 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              )}

              {/* 선택된 사용자 */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1"
                    >
                      {u.displayName || u.username}
                      <button onClick={() => toggleUserSelection(u)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 사용자 검색 */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="사용자 검색..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* 검색 결과 */}
              <div className="max-h-60 overflow-y-auto">
                {searchedUsers?.data.map((searchUser) => (
                  <button
                    key={searchUser.id}
                    onClick={() => toggleUserSelection(searchUser)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg ${
                      selectedUsers.find((u) => u.id === searchUser.id)
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : ''
                    }`}
                  >
                    {searchUser.avatar ? (
                      <img src={searchUser.avatar} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                        {(searchUser.displayName || searchUser.username)[0]}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium dark:text-white">
                        {searchUser.displayName || searchUser.username}
                      </p>
                      <p className="text-sm text-gray-500">@{searchUser.username}</p>
                    </div>
                    {selectedUsers.find((u) => u.id === searchUser.id) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}

                {userSearchQuery.length >= 2 && searchedUsers?.data.length === 0 && (
                  <p className="text-center text-gray-500 py-4">검색 결과가 없습니다</p>
                )}

                {userSearchQuery.length < 2 && (
                  <p className="text-center text-gray-500 py-4">
                    2글자 이상 입력하여 검색하세요
                  </p>
                )}
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="p-4 border-t dark:border-gray-700">
              <button
                onClick={() => createRoomMutation.mutate()}
                disabled={
                  selectedUsers.length === 0 ||
                  (isGroupMode && !groupName.trim()) ||
                  createRoomMutation.isPending
                }
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {createRoomMutation.isPending ? '생성 중...' : '대화 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
