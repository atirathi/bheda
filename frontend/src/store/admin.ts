import { create } from 'zustand';
import { api } from '@/lib/api';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  created_at: string;
  last_login?: string;
  challenge_count?: number;
}

export interface AdminStats {
  total_users: number;
  active_ctf: number;
  challenges_solved: number;
  flags_today: number;
  system_health: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
}

export interface MonitorEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface AdminChallenge {
  id: string;
  title: string;
  category_id: string;
  category_name: string;
  difficulty: string;
  is_active: boolean;
  waf_enabled: boolean;
  hints_enabled: boolean;
  solve_count: number;
}

interface AdminState {
  users: AdminUser[];
  stats: AdminStats | null;
  challenges: AdminChallenge[];
  monitorEvents: MonitorEvent[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: (params?: Record<string, string>) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  fetchMonitorEvents: () => Promise<void>;
  updateUser: (userId: string, data: Partial<AdminUser>) => Promise<void>;
  toggleChallenge: (challengeId: string, field: string, value: boolean) => Promise<void>;
  addMonitorEvent: (event: MonitorEvent) => void;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  users: [],
  stats: null,
  challenges: [],
  monitorEvents: [],
  isLoading: false,
  error: null,

  fetchUsers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<{ users: AdminUser[] }>('/admin/users', params);
      set({ users: data.users, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      set({ error: message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.get<AdminStats>('/admin/stats');
      set({ stats });
    } catch {
      // silently fail
    }
  },

  fetchChallenges: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ challenges: AdminChallenge[] }>('/admin/challenges');
      set({ challenges: data.challenges, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch challenges';
      set({ error: message, isLoading: false });
    }
  },

  fetchMonitorEvents: async () => {
    try {
      const data = await api.get<{ events: MonitorEvent[] }>('/admin/monitor/events');
      set({ monitorEvents: data.events });
    } catch {
      // silently fail
    }
  },

  updateUser: async (userId, data) => {
    try {
      await api.patch(`/admin/users/${userId}`, data);
      const { users } = get();
      set({
        users: users.map((u) => (u.id === userId ? { ...u, ...data } : u)),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      set({ error: message });
    }
  },

  toggleChallenge: async (challengeId, field, value) => {
    try {
      await api.patch(`/admin/challenges/${challengeId}`, { [field]: value });
      const { challenges } = get();
      set({
        challenges: challenges.map((c) =>
          c.id === challengeId ? { ...c, [field]: value } : c
        ),
      });
    } catch {
      // silently fail
    }
  },

  addMonitorEvent: (event) => {
    const { monitorEvents } = get();
    set({ monitorEvents: [event, ...monitorEvents].slice(0, 500) });
  },
}));
