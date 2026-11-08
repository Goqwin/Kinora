"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { formatCompact, formatFull, niceTicks } from "@/lib/stats/chart";

type Props = { labels: readonly (string | number)[]; values: readonly number[]; color: string; name: string };

const W = 420;
const H = 260;
const PAD = { top: 28, right: 16, bottom: 36, left: 52 };
const BAR = 24;
const R = 4;

const barPath = (x: number, top: number, bottom: number) =>
  `M${x},${bottom} V${top + R} Q${x},${top} ${x + R},${top} H${x + BAR - R} Q${x + BAR},${top} ${x + BAR},${top + R} V${bottom} Z`;

export function ColumnChart({ labels, values, color, name }: Props) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceTicks(0, Math.max(...values), 4);
  const yMax = ticks.at(-1) ?? 1;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / values.length;
  const base = PAD.top + plotH;
  const y = (v: number) => PAD.top + plotH * (1 - v / yMax);
  const last = values.length - 1;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${name}, ${labels[0]} to ${labels[last]}. ${labels[last]}: ${formatFull(values[last])}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--ink-muted)] text-[12px] tabular-nums">{formatCompact(t)}</text>
          </g>
        ))}
        {values.map((v, i) => {
          const bx = PAD.left + slot * i + (slot - BAR) / 2;
          return (
            <g key={labels[i]}>
              <motion.path
                d={barPath(bx, y(v), base)}
                fill={color}
                opacity={active === null || active === i ? 1 : 0.55}
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: "spring", stiffness: 90, damping: 16, delay: i * 0.08 }}
              />
              <text x={bx + BAR / 2} y={H - 10} textAnchor="middle" className="fill-[var(--ink-muted)] text-[12px] tabular-nums">{labels[i]}</text>
              {i === last && (
                <text x={bx + BAR / 2} y={y(v) - 8} textAnchor="middle" className="fill-[var(--ink)] text-[13px] font-semibold tabular-nums">{formatFull(v)}</text>
              )}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${labels[i]}: ${formatFull(v)}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none focus-visible:fill-[var(--surface-muted)]"
              />
            </g>
          );
        })}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-[var(--shadow-md)]"
          style={{ left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%` }}
        >
          <p className="font-semibold text-[var(--ink)]">July 1, {labels[active]}</p>
          <p className="tabular-nums text-[var(--ink-muted)]">{formatFull(values[active])} families</p>
        </div>
      )}
    </figure>
  );
}
