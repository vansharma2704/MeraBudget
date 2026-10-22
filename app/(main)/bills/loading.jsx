export default function BillsLoading() {
  const card = "rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse";
  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
      <div className="h-10 w-48 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} h-24`} />
        ))}
      </div>
      <div className={`${card} h-72 w-full`} />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`${card} h-16 w-full`} />
        ))}
      </div>
    </div>
  );
}
