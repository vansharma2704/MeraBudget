// Shown instantly while account data is being fetched from the DB
export default function AccountLoading() {
  const block = "rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse";
  return (
    <div className="space-y-8 px-5">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row gap-6 mt-8 sm:items-end justify-between border-b border-white/5 pb-8">
        <div className="space-y-3">
          <div className="h-14 w-64 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-32 rounded bg-white/[0.04] animate-pulse" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-10 w-48 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-28 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className={`${block} h-64 w-full`} />

      {/* Table skeleton */}
      <div className={`${block} h-96 w-full`} />
    </div>
  );
}
