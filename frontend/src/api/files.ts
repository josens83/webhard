import apiClient from './client';

export interface FileQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'rating';
  priceType?: string;
}

export const filesApi = {
  getFiles: async (query: FileQuery = {}) => {
    const response = await apiClient.get('/files', { params: query });
    return response.data;
  },

  getFileById: async (id: string) => {
    const response = await apiClient.get(`/files/${id}`);
    return response.data;
  },

  uploadFile: async (formData: FormData) => {
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
