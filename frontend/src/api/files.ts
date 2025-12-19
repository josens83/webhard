import apiClient from './client';

export interface FileQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'rating';
  priceType?: string;
}

export interface SearchQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  priceType?: string;
  fileType?: string;
  sortBy?: string;
  dateRange?: string;
}

export const filesApi = {
  getFiles: async (query: FileQuery = {}) => {
    const response = await apiClient.get('/files', { params: query });
    return response.data;
  },

  // Advanced search using elasticsearch
  searchFiles: async (query: SearchQuery = {}) => {
    try {
      // Try elasticsearch first
      const response = await apiClient.get('/search', {
        params: {
          ...query,
          tags: query.tags?.join(','),
        }
      });
      return response.data;
    } catch (error) {
      // Fallback to regular search if elasticsearch is not available
      const response = await apiClient.get('/files', {
        params: {
          search: query.q,
          category: query.category,
          sortBy: query.sortBy,
          page: query.page,
          limit: query.limit,
          priceType: query.priceType,
        }
      });
      return response.data;
    }
  },

  // Get search suggestions
  getSuggestions: async (query: string, limit: number = 5) => {
    try {
      const response = await apiClient.get('/search/suggest', {
        params: { q: query, limit }
      });
      return response.data;
    } catch {
      return { data: [] };
    }
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
