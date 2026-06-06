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
  total_challenges: number;
  total_submissions: number;
  active_events: number;
  // Backend monitor returns `system.{platform,cpu,memory}`, not `system_health`.
  // Reshape on the frontend so the dashboard can render it.
  system?: { platform?: string; cpu?: number; memory?: number };
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

  // Backend users router returns a bare list, not a `{ users: [...] }` wrapper.
  fetchUsers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<AdminUser[]>('/users', params);
      set({ users: data, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      set({ error: message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      // Combine monitor + challenges + submissions + events for a dashboard view.
      // Backend challenges router returns { items, total, skip, limit };
      // submissions/events still return bare paginated lists.
      const [monitor, challenges, submissions, events] = await Promise.all([
        api.get<{
          system: { platform?: string; cpu?: number; memory?: number };
          database: { total_users?: number; total_challenges?: number };
        }>('/monitor/health'),
        api
          .get<{ items: unknown[]; total: number } | unknown[]>('/challenges', { limit: '1' })
          .catch(() => ({ items: [], total: 0 })),
        api.get<unknown[]>('/submissions', { limit: '1' }).catch(() => []),
        api.get<unknown[]>('/events', { limit: '1' }).catch(() => []),
      ]);
      const challengeTotal =
        challenges && !Array.isArray(challenges) && typeof challenges.total === 'number'
          ? challenges.total
          : Array.isArray(challenges)
            ? challenges.length
            : 0;
      const stats: AdminStats = {
        total_users: monitor?.database?.total_users ?? 0,
        total_challenges: challengeTotal,
        total_submissions: Array.isArray(submissions) ? submissions.length : 0,
        active_events: Array.isArray(events) ? events.length : 0,
        system: monitor?.system,
      };
      set({ stats });
    } catch {
      // silently fail; dashboard shows placeholder
    }
  },

  // Backend challenges router returns { items, total, skip, limit }.
  fetchChallenges: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<
        { items: AdminChallenge[]; total: number; skip: number; limit: number } | AdminChallenge[]
      >('/challenges');
      const items = Array.isArray(data) ? data : data.items;
      set({ challenges: items, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch challenges';
      set({ error: message, isLoading: false });
    }
  },

  // Backend doesn't expose a streaming monitor endpoint; the WS
  // endpoint at /api/v1/ws is the live channel.  Until that's wired
  // up, the page falls back to polling /monitor/health for liveness.
  fetchMonitorEvents: async () => {
    try {
      await api.get('/monitor/health');
    } catch {
      // silently fail
    }
  },

  // Backend users router exposes PATCH /users/{id} with a server-side
  // allowlist (email, username, is_active, is_banned, role).  Ban toggling
  // also has a dedicated /users/{id}/ban endpoint that flips the flag.
  updateUser: async (userId, data) => {
    try {
      await api.patch(`/users/${userId}`, data);
      const { users } = get();
      set({
        users: users.map((u) => (u.id === userId ? { ...u, ...data } : u)),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      set({ error: message });
    }
  },

  // Backend challenges router exposes PATCH /challenges/{id} with
  // body `{ enabled?, waf_enabled?, hint_enabled? }` (ChallengeToggle
  // schema).  Map the frontend's generic (field,value) to whichever
  // backend key the field name corresponds to.
  toggleChallenge: async (challengeId, field, value) => {
    const FIELD_MAP: Record<string, string> = {
      is_active: 'enabled',
      waf_enabled: 'waf_enabled',
      hints_enabled: 'hint_enabled',
    };
    const backendField = FIELD_MAP[field] ?? field;
    try {
      await api.patch(`/challenges/${challengeId}`, { [backendField]: value });
      const { challenges } = get();
      set({
        challenges: challenges.map((c) =>
          c.id === challengeId ? { ...c, [field]: value } : c
        ),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update challenge';
      set({ error: message });
    }
  },

  addMonitorEvent: (event) => {
    const { monitorEvents } = get();
    set({ monitorEvents: [event, ...monitorEvents].slice(0, 500) });
  },
}));
