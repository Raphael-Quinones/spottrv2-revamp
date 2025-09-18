import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VideoDetailSkeleton() {
  return (
    <div>
      {/* Back button skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Video Player skeleton */}
      <Card className="mb-8 brutal-shadow">
        <CardContent className="p-0">
          <Skeleton className="aspect-video w-full" />
        </CardContent>
      </Card>

      {/* Video Info skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-5 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analysis Section skeleton */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Search bar skeleton */}
          <div className="mb-4">
            <Skeleton className="h-12 w-full border-4" />
          </div>

          {/* Results skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-2 border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40 brutal-shadow" />
        <Skeleton className="h-10 w-32 brutal-shadow" />
      </div>
    </div>
  );
}