import { cn } from "@/lib/utils";

type KinoraLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  tagline?: string;
  wordmarkClassName?: string;
  taglineClassName?: string;
};


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
        viewBox="0 0 100 65"
        className={cn("h-8 w-auto shrink-0", markClassName)}
        aria-hidden={showWordmark ? true : undefined}
        role={showWordmark ? undefined : "img"}
      >
        {!showWordmark ? <title>Kinora</title> : null}
        
        {/* Left Figure (Coral) */}
        <g fill="#F18973">
          <circle cx="48" cy="12" r="9" />
          <path d="M 62 38 C 50 25, 25 18, 10 30 C -5 42, 2 62, 12 65 C 25 68, 45 50, 62 38 Z" />
        </g>
        
        {/* Right Figure (Pale Green) with overlap blending */}
        <g fill="#B5DC94" style={{ mixBlendMode: "multiply" }}>
          <circle cx="78" cy="22" r="8" />
          <path d="M 32 38 C 45 45, 65 30, 85 32 C 102 34, 105 52, 92 62 C 78 72, 45 55, 32 38 Z" />
        </g>
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