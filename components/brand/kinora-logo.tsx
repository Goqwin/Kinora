import { cn } from "@/lib/utils";

type KinoraLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  tagline?: string;
  wordmarkClassName?: string;
  taglineClassName?: string;
};

/** Sleek twin-orbit mark + optional Kinora wordmark. */
export function KinoraLogo({
  className,
  markClassName,
  showWordmark = true,
  tagline,
  wordmarkClassName,
  taglineClassName,
}: KinoraLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 40 40"
        fill="none"
        className={cn("h-8 w-8 shrink-0 text-[var(--accent)]", markClassName)}
        aria-hidden={showWordmark ? true : undefined}
        role={showWordmark ? undefined : "img"}
      >
        {!showWordmark ? <title>Kinora</title> : null}
        <circle cx="15" cy="20" r="11" fill="currentColor" opacity="0.14" />
        <circle cx="25" cy="20" r="11" fill="currentColor" opacity="0.14" />
        <circle
          cx="15"
          cy="20"
          r="11"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="25"
          cy="20"
          r="11"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="2.35" fill="currentColor" />
      </svg>
      {showWordmark ? (
        <span className="flex min-w-0 flex-col justify-center leading-none">
          <span
            className={cn(
              "font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]",
              wordmarkClassName,
            )}
          >
            Kinora
          </span>
          {tagline ? (
            <span
              className={cn(
                "mt-1.5 hidden text-[0.68rem] font-medium tracking-[0.04em] text-[var(--ink-muted)] sm:block",
                taglineClassName,
              )}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
