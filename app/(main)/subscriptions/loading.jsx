export default function SubscriptionsLoading() {
  const card = "rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse";
  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
      <div className="h-10 w-52 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className={`${card} h-44 w-full`} />
      <div className="grid md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${card} h-20`} />
        ))}
      </div>
    </div>
  );
}
