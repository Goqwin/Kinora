import { useId } from "react";

import type { Parsed } from "@/lib/household/calculators";
import { cn } from "@/lib/utils";

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  parsed: Parsed;
  prefix?: string;
  suffix?: string;
  hint?: string;
  placeholder?: string;
  className?: string;
};

/** Text input (so "$1,200" is accepted) with a visible label, unit and inline error. */
export function NumberField({ label, value, onChange, parsed, prefix, suffix, hint, placeholder, className }: NumberFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, parsed.error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--ink)]">
        {label}
      </label>
      <div
        className={cn(
          "flex min-h-11 items-center rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 focus-within:ring-2 focus-within:ring-[var(--ring)]",
          parsed.error ? "border-[var(--destructive)]" : "border-[var(--border-strong)]/40",
        )}
      >
        {prefix ? <span aria-hidden className="pr-1 text-[var(--ink-muted)]">{prefix}</span> : null}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={parsed.error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
        />
        {suffix ? <span aria-hidden className="pl-1 text-sm text-[var(--ink-muted)]">{suffix}</span> : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-[var(--ink-muted)]">
          {hint}
        </p>
      ) : null}
      {parsed.error ? (
        <p id={errorId} className="text-sm font-medium text-[var(--destructive)]">
          {parsed.error}
        </p>
      ) : null}
    </div>
  );
}

export function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border border-[var(--border)] p-4", emphasis ? "bg-[var(--sky-soft)]" : "bg-[var(--surface)]")}>
      <dt className="text-sm text-[var(--ink-muted)]">{label}</dt>
      <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function EstimateNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--ink-muted)]">{children}</p>;
}
