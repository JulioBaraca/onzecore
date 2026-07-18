export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-3 p-6">
      <div className="h-6 w-56 rounded bg-slate-200" />
      <div className="h-10 w-full rounded-lg bg-slate-100" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
