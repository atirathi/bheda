import { create } from 'zustand';
import { api } from '@/lib/api';

export interface CTFEvent {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_team_size: number;
  status: 'upcoming' | 'active' | 'ended';
}

export interface TeamMember {
  id: string;
  username: string;
  email: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  score: number;
  members: TeamMember[];
  category_scores?: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  score: number;
  challenges_solved: number;
  last_flag_at?: string;
}

export interface CTFChallenge {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  solved: boolean;
  solved_by_team?: boolean;
}

interface CTFState {
  event: CTFEvent | null;
  team: Team | null;
  leaderboard: LeaderboardEntry[];
  challenges: CTFChallenge[];
  isLoading: boolean;
  error: string | null;
  fetchEvent: () => Promise<void>;
  fetchTeam: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  createTeam: (name: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  updateLeaderboard: (entry: LeaderboardEntry) => void;
}

export const useCTFStore = create<CTFState>()((set, get) => ({
  event: null,
  team: null,
  leaderboard: [],
  challenges: [],
  isLoading: false,
  error: null,

  fetchEvent: async () => {
    set({ isLoading: true });
    try {
      const event = await api.get<CTFEvent>('/ctf/event');
      set({ event, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch event';
      set({ error: message, isLoading: false });
    }
  },

  fetchTeam: async () => {
    try {
      const team = await api.get<Team>('/ctf/team');
      set({ team });
    } catch {
      // not in a team
    }
  },

  fetchLeaderboard: async () => {
    try {
      const data = await api.get<{ leaderboard: LeaderboardEntry[] }>('/ctf/leaderboard');
      set({ leaderboard: data.leaderboard });
    } catch {
      // silently fail
    }
  },

  fetchChallenges: async () => {
    try {
      const data = await api.get<{ challenges: CTFChallenge[] }>('/ctf/challenges');
      set({ challenges: data.challenges });
    } catch {
      // silently fail
    }
  },

  createTeam: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const team = await api.post<Team>('/ctf/teams', { name });
      set({ team, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team';
      set({ error: message, isLoading: false });
    }
  },

  joinTeam: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      const team = await api.post<Team>('/ctf/teams/join', { invite_code: inviteCode });
      set({ team, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join team';
      set({ error: message, isLoading: false });
    }
  },

  leaveTeam: async () => {
    try {
      await api.post('/ctf/teams/leave');
      set({ team: null });
    } catch {
      // silently fail
    }
  },

  updateLeaderboard: (entry) => {
    const { leaderboard } = get();
    const idx = leaderboard.findIndex((e) => e.team_id === entry.team_id);
    if (idx >= 0) {
      const updated = [...leaderboard];
      updated[idx] = entry;
      set({ leaderboard: updated });
    } else {
      set({ leaderboard: [...leaderboard, entry] });
    }
  },
}));
