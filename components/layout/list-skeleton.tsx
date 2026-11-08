export function ListSkeleton() {
  return (
    <div className="mt-10" aria-busy="true">
      <p className="sr-only" role="status">
        Loading
      </p>
      <div className="grid animate-pulse gap-4 motion-reduce:animate-none sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)]" />
        ))}
      </div>
    </div>
  );
}
