'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  FolderTree,
  Calendar,
  UserCog,
  Clock,
  Rabbit,
  Monitor,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/challenges', label: 'Challenges', icon: Shield },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/profiles', label: 'Profiles', icon: UserCog },
  { href: '/admin/schedule', label: 'Schedule', icon: Clock },
  { href: '/admin/rabbit-holes', label: 'Rabbit Holes', icon: Rabbit },
  { href: '/admin/monitor', label: 'Monitor', icon: Monitor },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!pathname.startsWith('/admin')) return null;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
          return (
            <Button
              key={link.href}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              asChild
              className={cn('w-full justify-start', collapsed && 'justify-center px-2')}
            >
              <Link href={link.href}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-3">{link.label}</span>}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
