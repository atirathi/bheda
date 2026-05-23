'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/auth';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { checkAuth, token } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (token) {
      const socket = connectSocket();
      return () => {
        disconnectSocket();
      };
    }
  }, [token]);

  const isAuthPage = pathname?.startsWith('/auth');
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAuthPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        {isAdminPage && <Sidebar />}
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  );
}
