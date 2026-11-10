export default function StudentLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 w-24 rounded bg-secondary" />
        <div className="h-6 w-44 rounded bg-secondary" />
      </div>
      <div className="h-36 rounded-lg border border-border bg-card" />
      <div className="h-48 rounded-lg border border-border bg-card" />
    </div>
  );
}
