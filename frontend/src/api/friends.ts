import { apiClient } from './client';

// Types
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  lastLoginAt?: string;
  isActive?: boolean;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friend: User;
  groupName?: string;
  nickname?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requester?: User;
  receiverId: string;
  receiver?: User;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  createdAt: string;
}

export interface FriendGroup {
  name: string;
  count: number;
}

export interface FriendsListResponse {
  success: boolean;
  data: {
    friends: Friend[];
    groups: FriendGroup[];
    totalCount: number;
  };
}

export interface FriendCountsResponse {
  success: boolean;
  data: {
    friendCount: number;
    pendingRequestCount: number;
  };
}

export interface SearchUserResult extends User {
  status: 'none' | 'friend' | 'blocked' | 'requested' | 'pending';
}

// API functions
export const friendsApi = {
  // 친구 목록 조회
  getFriends: async (groupName?: string, search?: string): Promise<FriendsListResponse> => {
    const response = await apiClient.get('/friends', {
      params: { groupName, search },
    });
    return response.data;
  },

  // 친구 수 및 요청 수 조회
  getCounts: async (): Promise<FriendCountsResponse> => {
    const response = await apiClient.get('/friends/counts');
    return response.data;
  },

  // 사용자 검색 (친구 추가용)
  searchUsers: async (query: string) => {
    const response = await apiClient.get('/friends/search', {
      params: { query },
    });
    return response.data;
  },

  // 친구 요청 보내기
  sendRequest: async (receiverId?: string, receiverUsername?: string, message?: string) => {
    const response = await apiClient.post('/friends/requests', {
      receiverId,
      receiverUsername,
      message,
    });
    return response.data;
  },

  // 받은 친구 요청 목록
  getReceivedRequests: async () => {
    const response = await apiClient.get('/friends/requests/received');
    return response.data;
  },

  // 보낸 친구 요청 목록
  getSentRequests: async () => {
    const response = await apiClient.get('/friends/requests/sent');
    return response.data;
  },

  // 친구 요청 수락
  acceptRequest: async (requestId: string) => {
    const response = await apiClient.post(`/friends/requests/${requestId}/accept`);
    return response.data;
  },

  // 친구 요청 거절
  rejectRequest: async (requestId: string) => {
    const response = await apiClient.post(`/friends/requests/${requestId}/reject`);
    return response.data;
  },

  // 친구 요청 취소
  cancelRequest: async (requestId: string) => {
    const response = await apiClient.delete(`/friends/requests/${requestId}`);
    return response.data;
  },

  // 친구 삭제
  removeFriend: async (friendId: string) => {
    const response = await apiClient.delete(`/friends/${friendId}`);
    return response.data;
  },

  // 친구 차단
  blockFriend: async (friendId: string) => {
    const response = await apiClient.post(`/friends/${friendId}/block`);
    return response.data;
  },

  // 친구 차단 해제
  unblockFriend: async (friendId: string) => {
    const response = await apiClient.post(`/friends/${friendId}/unblock`);
    return response.data;
  },

  // 차단 목록
  getBlockedUsers: async () => {
    const response = await apiClient.get('/friends/blocked');
    return response.data;
  },

  // 친구 그룹 변경
  updateGroup: async (friendId: string, groupName: string) => {
    const response = await apiClient.patch(`/friends/${friendId}/group`, {
      groupName,
    });
    return response.data;
  },

  // 친구 별명 설정
  updateNickname: async (friendId: string, nickname: string) => {
    const response = await apiClient.patch(`/friends/${friendId}/nickname`, {
      nickname,
    });
    return response.data;
  },

  // 즐겨찾기 토글
  toggleFavorite: async (friendId: string) => {
    const response = await apiClient.post(`/friends/${friendId}/favorite`);
    return response.data;
  },
};

export default friendsApi;
