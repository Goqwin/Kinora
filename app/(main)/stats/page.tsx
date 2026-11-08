import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { ColumnChart } from "@/components/stats/column-chart";
import { GrowthLineChart } from "@/components/stats/growth-line-chart";
import { SegmentedBar } from "@/components/stats/segmented-bar";
import { formatCompact, formatFull, formatSignedPct, indexSeries, percentOf } from "@/lib/stats/chart";
import { ALBERTA, CALGARY, CANADA, CENSUS_2021, SOURCES, YEARS } from "@/lib/stats/families";

export const metadata: Metadata = {
  title: "Single parents by the numbers",
  description: "Statistics Canada figures on one-parent families in Canada, Alberta, and Calgary.",
};

const LATEST = YEARS.length - 1;
const canadaShare2024 = percentOf(CANADA.oneParent[3], CANADA.total[3]);
const albertaGrowth = (indexSeries(ALBERTA.oneParent).at(-1) ?? 100) - 100;
const canadaGrowth = (indexSeries(CANADA.oneParent).at(-1) ?? 100) - 100;

const TILES = [
  { label: "One-parent families in Canada", value: formatFull(CANADA.oneParent[LATEST]), note: "July 1, 2025 estimate", tint: "bg-[var(--sky)]" },
  { label: "One-parent families in Alberta", value: formatFull(ALBERTA.oneParent[LATEST]), note: "July 1, 2025 estimate", tint: "bg-[var(--coral)]" },
  { label: "One-parent families in Calgary", value: formatFull(CALGARY.oneParentFamilies), note: "Statistics Canada", tint: "bg-[var(--lime)]" },
  { label: "Calgary children in one-parent families", value: formatFull(CALGARY.childrenInOneParentFamilies), note: "Statistics Canada", tint: "bg-[var(--sky)]" },
] as const;

const SERIES_1 = "var(--series-1)";
const SERIES_2 = "var(--series-2)";

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)] sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function StatsPage() {
  return (
    <div className="flex flex-col overflow-x-clip">
      <section className="relative isolate overflow-hidden bg-[image:var(--grad-soft)] px-4 py-14 sm:px-6 sm:py-20">
        <span aria-hidden className="absolute -right-16 -top-16 -z-10 size-64 rounded-full bg-[var(--blob-coral)] blur-2xl" />
        <span aria-hidden className="absolute -bottom-20 -left-10 -z-10 size-72 rounded-full bg-[var(--blob-sky)] blur-2xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[3fr_2fr]">
          <Reveal from="left">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">By the numbers</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-6xl">
              Support closer to home
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--ink-muted)]">
              If you are raising kids on your own, you are far from alone. Here is what Statistics Canada counts across the country, in Alberta, and right here in Calgary.
            </p>
          </Reveal>
          <Reveal from="right" className="sticker rounded-[var(--radius-lg)] bg-[var(--surface)] p-6 text-center sm:p-8">
            <p className="font-[family-name:var(--font-display)] text-6xl font-semibold text-[var(--ink)] sm:text-7xl">1 in 6</p>
            <p className="mt-3 text-[var(--ink-muted)]">
              Canadian families is a one-parent family ({canadaShare2024.toFixed(1)}% of {formatCompact(CANADA.total[3])} census families, July 1, 2024).
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile, i) => (
            <li key={tile.label}>
              <Reveal delay={i * 0.06} className={`sticker h-full rounded-[var(--radius-lg)] p-5 text-[#13243b] ${tile.tint}`}>
                <p className="text-sm font-semibold">{tile.label}</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold">{tile.value}</p>
                <p className="mt-1 text-sm text-[#13243b]">{tile.note}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <Reveal from="left" className="lg:col-span-2">
          <ChartCard
            title={`Alberta is growing about twice as fast`}
            subtitle={`One-parent families since ${YEARS[0]}, indexed so ${YEARS[0]} = 100. Alberta ${formatSignedPct(albertaGrowth)}, Canada ${formatSignedPct(canadaGrowth)}.`}
          >
            <GrowthLineChart
              years={YEARS}
              series={[
                { name: "Canada", color: SERIES_1, values: CANADA.oneParent },
                { name: "Alberta", color: SERIES_2, values: ALBERTA.oneParent },
              ]}
            />
          </ChartCard>
        </Reveal>

        <Reveal from="left">
          <ChartCard title="One-parent families in Alberta" subtitle={`Estimates on July 1, ${YEARS[0]} to ${YEARS[LATEST]}.`}>
            <ColumnChart name="One-parent families in Alberta" labels={YEARS} values={ALBERTA.oneParent} color={SERIES_2} />
          </ChartCard>
        </Reveal>

        <Reveal from="right">
          <ChartCard title="Who leads one-parent families" subtitle="Share of one-parent families in Canada, 2021 Census.">
            <div className="flex flex-col gap-8">
              <SegmentedBar
                label="One-parent families by parent"
                parts={[
                  { name: "Led by women", pct: CENSUS_2021.ledByWomenPct, color: SERIES_1, textColor: "#ffffff" },
                  { name: "Led by men", pct: CENSUS_2021.ledByMenPct, color: SERIES_2, textColor: "#10323c" },
                ]}
              />
              <SegmentedBar
                label="Census families in Canada, 2024"
                parts={[
                  { name: "One-parent families", pct: Number(canadaShare2024.toFixed(1)), color: SERIES_2, textColor: "#10323c" },
                  { name: "Couple families", pct: Number((100 - canadaShare2024).toFixed(1)), color: SERIES_1, textColor: "#ffffff" },
                ]}
              />
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                Mothers led {CENSUS_2021.youngChildFamiliesLedByMothersPct}% of the {formatFull(CENSUS_2021.youngChildFamilies)} one-parent families with young children. About {formatCompact(CENSUS_2021.childrenInOneParentFamilies)} children, or {CENSUS_2021.childrenSharePct}% of children in census families, lived in a one-parent family (2021 Census).
              </p>
            </div>
          </ChartCard>
        </Reveal>

        <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 text-sm lg:col-span-2">
          <summary className="cursor-pointer font-semibold text-[var(--ink)]">Show the data table</summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left tabular-nums">
              <thead className="text-[var(--ink-muted)]">
                <tr>
                  <th className="py-2 pr-4 font-semibold">July 1</th>
                  <th className="py-2 pr-4 font-semibold">Canada, one-parent</th>
                  <th className="py-2 pr-4 font-semibold">Canada, all families</th>
                  <th className="py-2 pr-4 font-semibold">Alberta, one-parent</th>
                  <th className="py-2 font-semibold">Alberta, all families</th>
                </tr>
              </thead>
              <tbody className="text-[var(--ink)]">
                {YEARS.map((year, i) => (
                  <tr key={year} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-4">{year}</td>
                    <td className="py-2 pr-4">{formatFull(CANADA.oneParent[i])}</td>
                    <td className="py-2 pr-4">{formatFull(CANADA.total[i])}</td>
                    <td className="py-2 pr-4">{formatFull(ALBERTA.oneParent[i])}</td>
                    <td className="py-2">{formatFull(ALBERTA.total[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <section className="text-sm text-[var(--ink-muted)] lg:col-span-2">
          <h2 className="font-semibold text-[var(--ink)]">Sources</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {Object.values(SOURCES).map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[var(--ink)]">
                  {source.label}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-[image:var(--grad-deep)] px-4 py-16 text-white sm:px-6">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              {formatFull(CALGARY.oneParentFamilies)} Calgary families. Let&apos;s connect.
            </h2>
            <p className="mt-3 text-white/85">
              Meet parents nearby, swap ideas, and find support that fits your week.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/community"
              className="sticker inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--lime)] px-7 py-3.5 text-base font-bold text-[#13243b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
            >
              Connect with parents
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border-2 border-white/80 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
            >
              Find support near me
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
