'use client';

import { useEffect } from 'react';
import { Users } from 'lucide-react';
import { UserTable } from '@/components/admin/UserTable';
import { useAdminStore } from '@/store/admin';

export default function AdminUsersPage() {
  const { fetchUsers } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage users, roles, and account status
        </p>
      </div>
      <UserTable />
    </div>
  );
}
