'use client';

import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Flag,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatsCard } from '@/components/admin/StatsCard';
import { useAdminStore } from '@/store/admin';

export default function AdminDashboard() {
  const { stats, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and quick actions
          </p>
        </div>
        <Button onClick={fetchStats}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          trend={5}
        />
        <StatsCard
          title="Active CTF"
          value={stats?.active_ctf ?? 0}
          icon={Activity}
        />
        <StatsCard
          title="Challenges Solved"
          value={stats?.challenges_solved ?? 0}
          icon={Shield}
          trend={12}
        />
        <StatsCard
          title="Flags Today"
          value={stats?.flags_today ?? 0}
          icon={Flag}
          trend={-3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU
                </span>
                <span>{stats?.system_health?.cpu ?? 0}%</span>
              </div>
              <Progress value={stats?.system_health?.cpu ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Memory
                </span>
                <span>{stats?.system_health?.memory ?? 0}%</span>
              </div>
              <Progress value={stats?.system_health?.memory ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Disk
                </span>
                <span>{stats?.system_health?.disk ?? 0}%</span>
              </div>
              <Progress value={stats?.system_health?.disk ?? 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start h-auto py-3">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3">
              <Shield className="mr-2 h-4 w-4" />
              Challenges
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3">
              <Plus className="mr-2 h-4 w-4" />
              New Challenge
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3">
              <Activity className="mr-2 h-4 w-4" />
              Live Monitor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
