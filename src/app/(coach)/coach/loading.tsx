export default function CoachLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2 border-b border-border pb-5">
        <div className="h-6 w-52 rounded bg-secondary" />
        <div className="h-4 w-80 max-w-full rounded bg-secondary/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-border bg-card p-4">
            <div className="h-3 w-24 rounded bg-secondary" />
            <div className="mt-3 h-6 w-12 rounded bg-secondary/80" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-lg border border-border bg-card" />
    </div>
  );
}
