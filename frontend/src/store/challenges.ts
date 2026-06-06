import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  // Backend `Category.enabled` and `Category.is_active` map 1:1, but the
  // admin frontend historically used `is_active`.  Keep both so the UI
  // works against either field name; `is_active` is the canonical one
  // and the backend returns `enabled` as an alias.
  is_active: boolean;
  enabled?: boolean;
  sort_order: number;
  challenge_count?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category_id: string;
  category_name?: string;
  cvss_score: number;
  points: number;
  is_active: boolean;
  waf_enabled: boolean;
  hints_enabled: boolean;
  solve_count: number;
  status?: 'solved' | 'unsolved' | 'locked';
}

interface ChallengesState {
  challenges: Challenge[];
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  difficulty: string | null;
  sortBy: string;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  fetchChallenges: (params?: Record<string, string>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  submitFlag: (challengeId: string, flag: string) => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setDifficulty: (difficulty: string | null) => void;
  setSortBy: (sort: string) => void;
  setCurrentPage: (page: number) => void;
}

export const useChallengesStore = create<ChallengesState>()((set, get) => ({
  challenges: [],
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  difficulty: null,
  sortBy: 'title',
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,

  fetchChallenges: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams: Record<string, string> = {};
      const { selectedCategory, searchQuery, difficulty, sortBy, currentPage } = get();

      if (params) {
        Object.assign(queryParams, params);
      }
      if (!params?.category && selectedCategory) queryParams.category = selectedCategory;
      if (!params?.search && searchQuery) queryParams.search = searchQuery;
      if (!params?.difficulty && difficulty) queryParams.difficulty = difficulty;
      if (!params?.sort) queryParams.sort = sortBy;
      queryParams.page = String(currentPage);
      queryParams.limit = '20';

      const data = await api.get<{
        challenges: Challenge[];
        total: number;
        page: number;
        total_pages: number;
      }>('/challenges', queryParams);

      set({
        challenges: data.challenges,
        totalPages: data.total_pages,
        currentPage: data.page,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch challenges';
      set({ error: message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      set({ categories: data });
    } catch {
      // silently fail
    }
  },

  submitFlag: async (challengeId, flag) => {
    try {
      await api.post<{ correct: boolean }>('/challenges/submit', {
        challenge_id: challengeId,
        flag,
      });
      return true;
    } catch {
      return false;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSelectedCategory: (category) => set({ selectedCategory: category, currentPage: 1 }),
  setDifficulty: (difficulty) => set({ difficulty, currentPage: 1 }),
  setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
