export function indexSeries(values: readonly number[]): number[] {
  const base = values[0];
  if (!base) return values.map(() => 0);
  return values.map((value) => (value / base) * 100);
}

export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : (part / whole) * 100;
}

export function niceTicks(min: number, max: number, target = 5): number[] {
  if (max <= min) return [min];
  const rough = (max - min) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick < max + step; tick += step) ticks.push(Number(tick.toFixed(6)));
  return ticks;
}

const compactFormat = new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 });
const fullFormat = new Intl.NumberFormat("en-CA");

export const formatCompact = (value: number) => compactFormat.format(value);
export const formatFull = (value: number) => fullFormat.format(value);
export const formatSignedPct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
