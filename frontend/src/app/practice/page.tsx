'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/challenges/ChallengeCard';
import { useChallengesStore, useChallengesStore as useChallengeActions } from '@/store/challenges';

function PracticePageInner() {
  const searchParams = useSearchParams();
  const {
    challenges,
    categories,
    isLoading,
    currentPage,
    totalPages,
    fetchChallenges,
    fetchCategories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    difficulty,
    setDifficulty,
    sortBy,
    setSortBy,
    setCurrentPage,
  } = useChallengeActions();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchParams.get('category')) {
      params.category = searchParams.get('category')!;
      setSelectedCategory(params.category);
    }
    fetchChallenges(params);
  }, [currentPage, selectedCategory, difficulty, sortBy]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    fetchChallenges({ search: searchInput });
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Practice Lab</h1>
        <p className="text-muted-foreground">
          Browse and solve cybersecurity challenges
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search challenges..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory ?? ''} onValueChange={(v) => setSelectedCategory(v || null)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty ?? ''} onValueChange={(v) => setDifficulty(v || null)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="insane">Insane</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Name</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="-cvss_score">CVSS Score</SelectItem>
            <SelectItem value="-solve_count">Most Solved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ChallengeCardSkeleton key={i} />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No challenges found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} mode="practice" />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <ChallengeCardSkeleton key={i} />
        ))}
      </div>
    }>
      <PracticePageInner />
    </Suspense>
  );
}
