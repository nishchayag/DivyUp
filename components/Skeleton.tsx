interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200/90 dark:bg-slate-700/90 rounded-xl ${className}`}
    />
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="p-5 surface-card rounded-2xl shadow-sm">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export function ExpenseItemSkeleton() {
  return (
    <div className="p-4 surface-card rounded-2xl shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="text-right">
          <Skeleton className="h-5 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function GroupDetailSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>

      <div className="mb-6 p-4 surface-card rounded-2xl shadow">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-3">
        <ExpenseItemSkeleton />
        <ExpenseItemSkeleton />
        <ExpenseItemSkeleton />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 surface-card rounded-2xl px-5 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </div>
    </div>
  );
}
