'use client';

import { useState } from 'react';
import { Filter, Search, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface BulkActionBarProps {
  onBulkAction?: (action: string, filters: FilterCondition[]) => void;
}

export function BulkActionBar({ onBulkAction }: BulkActionBarProps) {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);

  const addFilter = () => {
    setFilters([...filters, { field: 'difficulty', operator: 'eq', value: '' }]);
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx: number, key: keyof FilterCondition, value: string) => {
    const updated = filters.map((f, i) => (i === idx ? { ...f, [key]: value } : f));
    setFilters(updated);
  };

  const actions = [
    { value: 'enable', label: 'Enable All' },
    { value: 'disable', label: 'Disable All' },
    { value: 'enable_waf', label: 'Enable WAF' },
    { value: 'disable_waf', label: 'Disable WAF' },
    { value: 'enable_hints', label: 'Enable Hints' },
    { value: 'disable_hints', label: 'Disable Hints' },
  ];

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilterBuilder(!showFilterBuilder)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters {filters.length > 0 && `(${filters.length})`}
        </Button>
        <Select onValueChange={(value) => onBulkAction?.(value, filters)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Bulk action..." />
          </SelectTrigger>
          <SelectContent>
            {actions.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showFilterBuilder && (
        <div className="space-y-2">
          {filters.map((filter, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Select
                value={filter.field}
                onValueChange={(v) => updateFilter(idx, 'field', v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filter.operator}
                onValueChange={(v) => updateFilter(idx, 'operator', v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eq">equals</SelectItem>
                  <SelectItem value="neq">not equals</SelectItem>
                  <SelectItem value="contains">contains</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                className="w-32"
                value={filter.value}
                onChange={(e) => updateFilter(idx, 'value', e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => removeFilter(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addFilter}>
            + Add filter
          </Button>
        </div>
      )}
    </div>
  );
}
