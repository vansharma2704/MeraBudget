export default function ReportsLoading() {
  const card = "rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse";
  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
      <div className="flex flex-col gap-2">
        <div className="h-10 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="h-4 w-72 rounded bg-white/[0.04] animate-pulse" />
      </div>
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <div className={`${card} h-48`} />
        <div className={`${card} h-48`} />
      </div>
      <div className={`${card} h-40 w-full max-w-4xl mx-auto`} />
    </div>
  );
}
