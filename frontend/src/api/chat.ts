import { apiClient } from './client';

// Types
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  user: User;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  lastReadAt?: string;
  unreadCount: number;
  isMuted: boolean;
  isActive: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'LINK';
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  senderId: string;
  sender: User;
  chatRoomId: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: { displayName?: string };
  };
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'SUPPORT' | 'FILE_DISCUSSION' | 'COURSE_DISCUSSION';
  lastMessage?: string;
  lastMessageAt?: string;
  isActive: boolean;
  participants: ChatParticipant[];
  messages?: Message[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const chatApi = {
  // 채팅방 목록 조회
  getChatRooms: async () => {
    const response = await apiClient.get<{ success: boolean; data: ChatRoom[] }>('/chat/rooms');
    return response.data;
  },

  // 채팅방 생성 (1:1)
  createDirectChat: async (targetUserId: string) => {
    const response = await apiClient.post<{ success: boolean; data: ChatRoom; message: string }>('/chat/rooms', {
      targetUserId,
      type: 'DIRECT',
    });
    return response.data;
  },

  // 그룹 채팅방 생성
  createGroupChat: async (name: string, participantIds: string[]) => {
    const response = await apiClient.post<{ success: boolean; data: ChatRoom; message: string }>('/chat/rooms', {
      type: 'GROUP',
      name,
      participantIds,
    });
    return response.data;
  },

  // 채팅방 상세 조회
  getChatRoom: async (roomId: string) => {
    const response = await apiClient.get<{ success: boolean; data: ChatRoom }>(`/chat/rooms/${roomId}`);
    return response.data;
  },

  // 메시지 목록 조회
  getMessages: async (roomId: string, cursor?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: Message[];
      hasMore: boolean;
      nextCursor?: string;
    }>(`/chat/rooms/${roomId}/messages?${params.toString()}`);
    return response.data;
  },

  // 메시지 전송
  sendMessage: async (roomId: string, data: {
    content: string;
    messageType?: string;
    replyToId?: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: Message }>(`/chat/rooms/${roomId}/messages`, data);
    return response.data;
  },

  // 메시지 수정
  updateMessage: async (messageId: string, content: string) => {
    const response = await apiClient.put<{ success: boolean; data: Message }>(`/chat/messages/${messageId}`, {
      content,
    });
    return response.data;
  },

  // 메시지 삭제
  deleteMessage: async (messageId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/chat/messages/${messageId}`);
    return response.data;
  },

  // 채팅방 나가기
  leaveChatRoom: async (roomId: string) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/chat/rooms/${roomId}/leave`);
    return response.data;
  },

  // 참가자 초대
  inviteParticipants: async (roomId: string, userIds: string[]) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/chat/rooms/${roomId}/invite`, {
      userIds,
    });
    return response.data;
  },

  // 읽음 처리
  markAsRead: async (roomId: string) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/chat/rooms/${roomId}/read`);
    return response.data;
  },

  // 사용자 검색
  searchUsers: async (query: string) => {
    const response = await apiClient.get<{ success: boolean; data: User[] }>(`/chat/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default chatApi;
