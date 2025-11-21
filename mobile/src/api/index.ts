import apiClient from './client';

export interface LoginData {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export const authApi = {
  login: async (data: LoginData) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export const filesApi = {
  getFiles: async (params?: any) => {
    const response = await apiClient.get('/files', { params });
    return response.data;
  },

  getFileById: async (id: string) => {
    const response = await apiClient.get(`/files/${id}`);
    return response.data;
  },

  downloadFile: async (id: string) => {
    const response = await apiClient.post(`/files/${id}/download`);
    return response.data;
  },

  purchaseFile: async (id: string, paymentMethod: string) => {
    const response = await apiClient.post(`/files/${id}/purchase`, {
      paymentMethod,
    });
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await apiClient.post(`/files/${id}/favorite`);
    return response.data;
  },
};

export const paymentApi = {
  chargeCash: async (amount: number, paymentMethod: string) => {
    const response = await apiClient.post('/payments/charge', {
      amount,
      paymentMethod,
    });
    return response.data;
  },

  getTransactions: async (params?: any) => {
    const response = await apiClient.get('/payments/transactions', { params });
    return response.data;
  },
};

export const userApi = {
  getMyFiles: async (params?: any) => {
    const response = await apiClient.get('/users/my-files', { params });
    return response.data;
  },

  getMyPurchases: async (params?: any) => {
    const response = await apiClient.get('/users/my-purchases', { params });
    return response.data;
  },

  getMyFavorites: async (params?: any) => {
    const response = await apiClient.get('/users/my-favorites', { params });
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
};
