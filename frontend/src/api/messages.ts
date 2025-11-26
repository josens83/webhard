import { apiClient } from './client';

// Types
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface MessageListResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    unreadCount?: number;
  };
}

export interface SendMessageParams {
  receiverId?: string;
  receiverUsername?: string;
  content: string;
}

// API functions
export const messagesApi = {
  // 쪽지 보내기
  send: async (params: SendMessageParams) => {
    const response = await apiClient.post('/messages/send', params);
    return response.data;
  },

  // 받은 쪽지 목록
  getInbox: async (page = 1, limit = 20): Promise<MessageListResponse> => {
    const response = await apiClient.get('/messages/inbox', {
      params: { page, limit },
    });
    return response.data;
  },

  // 보낸 쪽지 목록
  getSent: async (page = 1, limit = 20): Promise<MessageListResponse> => {
    const response = await apiClient.get('/messages/sent', {
      params: { page, limit },
    });
    return response.data;
  },

  // 쪽지 상세 보기
  get: async (id: string) => {
    const response = await apiClient.get(`/messages/${id}`);
    return response.data;
  },

  // 쪽지 삭제
  delete: async (id: string) => {
    const response = await apiClient.delete(`/messages/${id}`);
    return response.data;
  },

  // 여러 쪽지 삭제
  deleteMany: async (messageIds: string[], type: 'inbox' | 'sent') => {
    const response = await apiClient.post('/messages/delete-many', {
      messageIds,
      type,
    });
    return response.data;
  },

  // 읽지 않은 쪽지 수
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data;
  },

  // 모든 쪽지 읽음 처리
  markAllAsRead: async () => {
    const response = await apiClient.post('/messages/mark-all-read');
    return response.data;
  },
};

export default messagesApi;
