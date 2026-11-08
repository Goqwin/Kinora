type Part = { name: string; pct: number; color: string; textColor: string };

export function SegmentedBar({ label, parts }: { label: string; parts: readonly Part[] }) {
  return (
    <figure>
      <div className="flex h-9 gap-0.5" role="img" aria-label={`${label}: ${parts.map((p) => `${p.name} ${p.pct}%`).join(", ")}`}>
        {parts.map((p) => (
          <div
            key={p.name}
            title={`${p.name}: ${p.pct}%`}
            className="flex items-center rounded px-2 text-[1.25rem] font-bold"
            style={{ width: `${p.pct}%`, background: p.color, color: p.textColor }}
          >
            {p.pct >= 12 && `${p.pct}%`}
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]" aria-label="Legend">
        {parts.map((p) => (
          <li key={p.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
            {p.name}
          </li>
        ))}
      </ul>
    </figure>
  );
}
