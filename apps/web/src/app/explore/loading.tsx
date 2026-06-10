export default function ExploreLoading() {
  return (
    <div className="bg-surface font-body min-h-screen">
      <div className="fixed top-[72px] left-0 right-0 bottom-0 flex">
        <aside className="hidden md:flex md:w-[420px] flex-col border-r border-outline-variant/15">
          <div className="p-6 space-y-4">
            <div className="h-6 skeleton-enhanced rounded w-1/2" />
            <div className="h-12 skeleton-enhanced rounded-xl" />
            <div className="flex gap-2">
              <div className="h-9 skeleton-enhanced rounded-full w-20" />
              <div className="h-9 skeleton-enhanced rounded-full w-20" />
              <div className="h-9 skeleton-enhanced rounded-full w-24" />
            </div>
          </div>
          <div className="flex-1 px-6 py-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="h-44 skeleton-enhanced" />
                <div className="p-5 space-y-3 bg-white">
                  <div className="h-5 skeleton-enhanced rounded w-3/4" />
                  <div className="h-4 skeleton-enhanced rounded w-1/2" />
                  <div className="h-10 skeleton-enhanced rounded" />
                </div>
              </div>
            ))}
          </div>
        </aside>
        <div className="flex-1 bg-surface-container-low flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
