export default function MyBookingsLoading() {
  return (
    <div className="bg-surface font-body min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 space-y-6">
        <div className="h-8 skeleton-enhanced rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-9 skeleton-enhanced rounded-full w-28" />
          <div className="h-9 skeleton-enhanced rounded-full w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 skeleton-enhanced rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
