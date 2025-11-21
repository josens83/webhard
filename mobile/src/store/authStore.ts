import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  cash: number;
  point: number;
  couponCount: number;
  stars: number;
  isAdmin: boolean;
  isSeller: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user, token) => {
    await SecureStore.setItemAsync('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    }));
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
