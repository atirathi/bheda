'use client';

import { useEffect, useState } from 'react';
import {
  FolderTree,
  GripVertical,
  Palette,
  Image,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Category } from '@/store/challenges';

const iconOptions = [
  'Globe',
  'Lock',
  'Code2',
  'Server',
  'Database',
  'Bug',
  'Shield',
  'Zap',
  'Cloud',
  'Terminal',
];

const colorOptions = [
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#22c55e',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Shield');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/categories/${id}`, { is_active: isActive });
      setCategories(categories.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)));
    } catch {
      // silently fail
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await api.post<Category>('/categories', {
        name: newName.trim(),
        icon: newIcon,
        color: newColor,
      });
      setCategories([...categories, created]);
      setNewName('');
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter((c) => c.id !== id));
    } catch {
      // silently fail
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FolderTree className="h-6 w-6" />
          Category Manager
        </h1>
        <p className="text-muted-foreground">
          Manage challenge categories, reorder, and configure
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Category</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <div className="flex items-center gap-1 rounded-md border p-1">
              {iconOptions.slice(0, 4).map((icon) => (
                <Button
                  key={icon}
                  variant={newIcon === icon ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setNewIcon(icon)}
                >
                  <Image className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-md border p-1">
              {colorOptions.slice(0, 4).map((color) => (
                <button
                  key={color}
                  className={cn(
                    'h-6 w-6 rounded-full border-2',
                    newColor === color ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!newName.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4"
            >
              <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <div className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.challenge_count ?? 0} challenges
                </p>
              </div>
              <Switch
                checked={cat.is_active}
                onCheckedChange={(v) => handleToggle(cat.id, v)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(cat.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}
