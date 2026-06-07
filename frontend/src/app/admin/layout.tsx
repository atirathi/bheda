'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

/**
 * Admin route guard.  Every page under `/admin/*` is wrapped in this
 * layout, so we centralize the admin check here.  Without this guard,
 * a regular user could navigate to /admin/users and the page would
 * render with broken API calls (the backend's `require_admin`
 * dependency would 403 each fetch).  Frontend-side gating keeps the
 * UI from showing empty/broken pages to non-admins.
 *
 * The BACKEND still enforces admin on every `/api/v1/admin/*` route;
 * this is a UX layer, not a security boundary.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!token) {
      // Not logged in — bounce to login.
      router.replace('/auth/login');
      return;
    }
    if (!user) {
      // Token present but user object not yet hydrated.
      void checkAuth();
      return;
    }
    if (user.role !== 'admin') {
      // Authenticated but not admin — bounce to practice.
      router.replace('/practice');
    }
  }, [user, token, router, checkAuth]);

  if (!token || (user && user.role !== 'admin')) {
    return null;
  }
  return <>{children}</>;
}
