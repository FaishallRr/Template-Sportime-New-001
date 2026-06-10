export default function CheckoutLoading() {
  return (
    <div className="bg-surface font-body min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 space-y-6">
        <div className="h-8 skeleton-enhanced rounded w-1/3" />
        <div className="h-40 skeleton-enhanced rounded-2xl" />
        <div className="h-32 skeleton-enhanced rounded-2xl" />
        <div className="h-24 skeleton-enhanced rounded-2xl" />
        <div className="h-14 skeleton-enhanced rounded-xl" />
      </div>
    </div>
  );
}
