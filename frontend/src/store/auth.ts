import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  avatar?: string;
  team_id?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password, mfaCode) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ user: User; token: string }>('/auth/login', {
            email,
            password,
            mfa_code: mfaCode,
          });
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (email, username, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ user: User; token: string }>('/auth/register', {
            email,
            username,
            password,
          });
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const user = await api.get<User>('/auth/me');
          set({ user, isLoading: false });
        } catch {
          set({ user: null, token: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'bheda_auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
