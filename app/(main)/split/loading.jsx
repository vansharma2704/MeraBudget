export default function SplitLoading() {
  const card = "rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse";
  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
      <div className="flex justify-between items-center">
        <div className="h-10 w-44 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-white/[0.06] animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${card} h-36`} />
        ))}
      </div>
    </div>
  );
}
