"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="space-y-4 pt-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
