import { CATEGORIES, type Resource } from "@/types/resource";

type Props = { resource: Resource; selected: boolean; onSelect: (id: string) => void };

const formatAges = (min: number | null, max: number | null) =>
  min === null && max === null ? "All ages" : min === null ? `Up to ${max}` : max === null ? `${min}+` : `${min}–${max}`;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { dateStyle: "medium", timeZone: "UTC" });

export function ResourceCard({ resource: r, selected, onSelect }: Props) {
  const category = CATEGORIES[r.category];
  const details: [string, string | null][] = [
    ["Cost", r.cost],
    ["Eligibility", r.eligibility],
    ["Ages", formatAges(r.minAge, r.maxAge)],
    ["Address", r.address ?? "Available province-wide"],
    ["Phone", r.phone],
  ];

  return (
    <article
      id={`resource-${r.id}`}
      onClick={() => onSelect(r.id)}
      className={`grid cursor-pointer gap-3 rounded-xl border bg-white p-4 transition-colors ${selected ? "border-teal-700 ring-1 ring-teal-700" : "border-neutral-200 hover:border-neutral-400"}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">
          <button type="button" className="text-left">{r.name}</button>
        </h3>
        <span className="text-sm tabular-nums text-neutral-600">{r.distanceKm === null ? "Province-wide" : `${r.distanceKm.toFixed(1)} km`}</span>
      </header>

      <span className="w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: category.color }}>
        {category.label}
      </span>

      <p className="text-neutral-800">{r.description}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {details.filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-neutral-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-sm">
        {r.website && (
          <a href={r.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-medium text-teal-700 underline">
            Visit website
          </a>
        )}
        <span className="text-neutral-500">Verified {formatDate(r.lastVerifiedAt)}</span>
      </footer>
    </article>
  );
}
