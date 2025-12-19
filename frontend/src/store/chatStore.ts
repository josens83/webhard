import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ChatRoom, Message, User } from '../api/chat';

interface TypingUser {
  userId: string;
  username: string;
}

interface ChatState {
  // Socket connection
  socket: Socket | null;
  isConnected: boolean;

  // Chat rooms
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;

  // Messages
  messages: Message[];
  hasMoreMessages: boolean;
  nextCursor: string | null;

  // UI state
  isLoading: boolean;
  typingUsers: TypingUser[];
  onlineUsers: Set<string>;

  // Total unread count
  totalUnreadCount: number;

  // Actions
  initSocket: (token: string) => void;
  disconnectSocket: () => void;

  setRooms: (rooms: ChatRoom[]) => void;
  setCurrentRoom: (room: ChatRoom | null) => void;
  addRoom: (room: ChatRoom) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  prependMessages: (messages: Message[]) => void;

  setHasMoreMessages: (hasMore: boolean) => void;
  setNextCursor: (cursor: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  addTypingUser: (roomId: string, user: TypingUser) => void;
  removeTypingUser: (roomId: string, userId: string) => void;

  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;

  decrementUnreadCount: (roomId: string) => void;
  calculateTotalUnread: () => void;

  // Socket event emitters
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  markAsRead: (roomId: string) => void;

  // Reset
  reset: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  rooms: [],
  currentRoom: null,
  messages: [],
  hasMoreMessages: false,
  nextCursor: null,
  isLoading: false,
  typingUsers: [],
  onlineUsers: new Set(),
  totalUnreadCount: 0,

  // Socket initialization
  initSocket: (token: string) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    // 새 메시지 수신
    socket.on('message:new', (message: Message) => {
      const { currentRoom, rooms } = get();

      // 현재 채팅방의 메시지인 경우 추가
      if (currentRoom && message.chatRoomId === currentRoom.id) {
        get().addMessage(message);
      }

      // 채팅방 목록 업데이트
      const updatedRooms = rooms.map((room) => {
        if (room.id === message.chatRoomId) {
          return {
            ...room,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount: currentRoom?.id === room.id ? room.unreadCount : (room.unreadCount || 0) + 1,
          };
        }
        return room;
      });

      set({ rooms: updatedRooms });
      get().calculateTotalUnread();
    });

    // 메시지 수정
    socket.on('message:updated', (message: Message) => {
      get().updateMessage(message.id, message);
    });

    // 메시지 삭제
    socket.on('message:deleted', ({ messageId }: { messageId: string }) => {
      get().removeMessage(messageId);
    });

    // 타이핑 시작
    socket.on('typing:start', ({ userId, username, roomId }: { userId: string; username: string; roomId: string }) => {
      get().addTypingUser(roomId, { userId, username });
    });

    // 타이핑 종료
    socket.on('typing:stop', ({ userId, roomId }: { userId: string; roomId: string }) => {
      get().removeTypingUser(roomId, userId);
    });

    // 사용자 온라인
    socket.on('user:online', ({ userId }: { userId: string }) => {
      get().setUserOnline(userId);
    });

    // 사용자 오프라인
    socket.on('user:offline', ({ userId }: { userId: string }) => {
      get().setUserOffline(userId);
    });

    // 메시지 읽음 처리
    socket.on('messages:read', ({ roomId, userId }: { roomId: string; userId: string }) => {
      // 읽음 상태 UI 업데이트 (선택적)
      console.log(`User ${userId} read messages in room ${roomId}`);
    });

    // 채팅 알림
    socket.on('chat:notification', ({ roomId, message }: { roomId: string; message: Message }) => {
      // 브라우저 알림 (선택적)
      if (Notification.permission === 'granted') {
        new Notification('새 메시지', {
          body: `${message.sender.displayName || message.sender.username}: ${message.content}`,
        });
      }
    });

    // 참가자 퇴장
    socket.on('participant:left', ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      console.log(`${username} left room ${roomId}`);
    });

    // 참가자 초대
    socket.on('participants:invited', ({ roomId }: { roomId: string }) => {
      console.log(`New participants invited to room ${roomId}`);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  // Room actions
  setRooms: (rooms) => {
    set({ rooms });
    get().calculateTotalUnread();
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  addRoom: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),

  updateRoom: (roomId, updates) => set((state) => ({
    rooms: state.rooms.map((room) =>
      room.id === roomId ? { ...room, ...updates } : room
    ),
  })),

  // Message actions
  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  })),

  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((msg) => msg.id !== messageId),
  })),

  prependMessages: (messages) => set((state) => ({
    messages: [...messages, ...state.messages],
  })),

  setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),
  setNextCursor: (cursor) => set({ nextCursor: cursor }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // Typing actions
  addTypingUser: (roomId, user) => {
    const { currentRoom, typingUsers } = get();
    if (currentRoom?.id === roomId && !typingUsers.find((u) => u.userId === user.userId)) {
      set({ typingUsers: [...typingUsers, user] });

      // 3초 후 자동 제거
      setTimeout(() => {
        get().removeTypingUser(roomId, user.userId);
      }, 3000);
    }
  },

  removeTypingUser: (roomId, userId) => {
    const { currentRoom, typingUsers } = get();
    if (currentRoom?.id === roomId) {
      set({ typingUsers: typingUsers.filter((u) => u.userId !== userId) });
    }
  },

  // Online status
  setUserOnline: (userId) => set((state) => {
    const newOnlineUsers = new Set(state.onlineUsers);
    newOnlineUsers.add(userId);
    return { onlineUsers: newOnlineUsers };
  }),

  setUserOffline: (userId) => set((state) => {
    const newOnlineUsers = new Set(state.onlineUsers);
    newOnlineUsers.delete(userId);
    return { onlineUsers: newOnlineUsers };
  }),

  // Unread count
  decrementUnreadCount: (roomId) => set((state) => ({
    rooms: state.rooms.map((room) =>
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    ),
  })),

  calculateTotalUnread: () => {
    const { rooms } = get();
    const total = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    set({ totalUnreadCount: total });
  },

  // Socket event emitters
  joinRoom: (roomId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('chat:join', roomId);
    }
  },

  leaveRoom: (roomId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('chat:leave', roomId);
    }
  },

  startTyping: (roomId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('chat:typing:start', roomId);
    }
  },

  stopTyping: (roomId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('chat:typing:stop', roomId);
    }
  },

  markAsRead: (roomId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('chat:read', { roomId });
    }
    get().decrementUnreadCount(roomId);
    get().calculateTotalUnread();
  },

  // Reset
  reset: () => {
    get().disconnectSocket();
    set({
      socket: null,
      isConnected: false,
      rooms: [],
      currentRoom: null,
      messages: [],
      hasMoreMessages: false,
      nextCursor: null,
      isLoading: false,
      typingUsers: [],
      onlineUsers: new Set(),
      totalUnreadCount: 0,
    });
  },
}));

export default useChatStore;
