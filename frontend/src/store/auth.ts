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
  // `login` accepts either an email or a username; the backend
  // `UserLogin` schema resolves the field via `resolved_login()`.
  login: (login: string, password: string, mfaCode?: string) => Promise<void>;
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

      login: async (login, password, mfaCode) => {
        set({ isLoading: true, error: null });
        try {
          // Send both `email` and `username` so the backend resolver can
          // pick whichever matches a real user.  We never send a raw
          // password more than once, never log it, and never persist it.
          const payload: Record<string, string> = { password };
          if (login.includes('@')) {
            payload.email = login;
          } else {
            payload.username = login;
          }
          if (mfaCode) payload.mfa_code = mfaCode;
          const data = await api.post<{ user: User; token: string }>('/auth/login', payload);
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
