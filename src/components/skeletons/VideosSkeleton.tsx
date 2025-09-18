import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VideosSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 brutal-shadow" />
      </div>

      {/* Search Bar skeleton */}
      <div className="mb-8">
        <div className="relative">
          <Skeleton className="h-14 w-full border-4" />
        </div>
      </div>

      {/* Videos Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="brutal-shadow">
            <CardContent className="p-6">
              {/* Header with icon and badge */}
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="w-8 h-8" />
                <Skeleton className="h-6 w-24" />
              </div>

              {/* Title */}
              <Skeleton className="h-6 w-full mb-2" />

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* Analysis scope */}
              <div className="mb-4">
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}