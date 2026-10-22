// Shown instantly on navigation while the server fetches data for the next page
export default function Loading() {
  const block = "rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse";
  return (
    <div className="px-5 mt-6 space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${block} h-28`} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`${block} h-72 lg:col-span-2`} />
        <div className={`${block} h-72`} />
      </div>
    </div>
  );
}
