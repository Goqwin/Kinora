"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { formatFull, formatSignedPct, indexSeries, niceTicks } from "@/lib/stats/chart";

type Series = { name: string; color: string; values: readonly number[] };
type Props = { years: readonly number[]; series: readonly [Series, Series] };

const W = 640;
const H = 300;
const PAD = { top: 16, right: 132, bottom: 36, left: 44 };

export function GrowthLineChart({ years, series }: Props) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const indexed = series.map((s) => indexSeries(s.values));
  const all = indexed.flat();
  const ticks = niceTicks(Math.floor(Math.min(...all)), Math.max(...all), 4);
  const yMin = ticks[0];
  const yMax = ticks.at(-1) ?? 100;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (plotW * i) / (years.length - 1);
  const y = (v: number) => PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin));
  const pathFor = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const last = years.length - 1;

  return (
    <figure className="relative">
      <ul className="mb-3 flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]" aria-label="Legend">
        {series.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.name}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`Growth of one-parent families, indexed to ${years[0]} equals 100. ${series.map((s, i) => `${s.name} ${formatSignedPct((indexed[i].at(-1) ?? 100) - 100)}`).join(", ")} by ${years.at(-1)}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--ink-muted)] text-[12px] tabular-nums">{t}</text>
          </g>
        ))}
        {years.map((year, i) => (
          <text key={year} x={x(i)} y={H - 10} textAnchor="middle" className="fill-[var(--ink-muted)] text-[12px] tabular-nums">{year}</text>
        ))}
        {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--border-strong)" strokeWidth={1} />}
        {series.map((s, si) => (
          <g key={s.name}>
            <motion.path
              d={pathFor(indexed[si])}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: si * 0.2 }}
            />
            <circle cx={x(last)} cy={y(indexed[si][last])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
            {active !== null && <circle cx={x(active)} cy={y(indexed[si][active])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />}
            <text x={x(last) + 12} y={y(indexed[si][last])} dy="0.32em" className="fill-[var(--ink)] text-[13px] font-semibold">
              {s.name} {formatSignedPct(indexed[si][last] - 100)}
            </text>
          </g>
        ))}
        {years.map((year, i) => (
          <rect
            key={year}
            x={x(i) - plotW / (years.length - 1) / 2}
            y={PAD.top}
            width={plotW / (years.length - 1)}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            role="img"
            aria-label={`${year}: ${series.map((s) => `${s.name} ${formatFull(s.values[i])}`).join(", ")}`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="outline-none focus-visible:fill-[var(--surface-muted)]"
          />
        ))}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute top-10 z-10 w-48 -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm shadow-[var(--shadow-md)]"
          style={{ left: `${(x(active) / W) * 100}%` }}
        >
          <p className="font-semibold text-[var(--ink)]">July 1, {years[active]}</p>
          {series.map((s, si) => (
            <p key={s.name} className="mt-1 flex items-center gap-2 text-[var(--ink-muted)]">
              <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}: <span className="font-semibold tabular-nums text-[var(--ink)]">{formatFull(s.values[active])}</span>
              <span className="tabular-nums">({indexed[si][active].toFixed(1)})</span>
            </p>
          ))}
        </div>
      )}
    </figure>
  );
}
