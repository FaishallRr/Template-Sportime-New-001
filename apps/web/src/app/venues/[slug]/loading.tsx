export default function VenueDetailLoading() {
  return (
    <div className="bg-surface font-body min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 space-y-6">
        <div className="h-[300px] skeleton-enhanced rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 skeleton-enhanced rounded w-2/3" />
          <div className="h-5 skeleton-enhanced rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-7 skeleton-enhanced rounded-full w-24" />
            <div className="h-7 skeleton-enhanced rounded-full w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 skeleton-enhanced rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
