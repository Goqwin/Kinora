import Link from "next/link";

import { CRISIS_INTRO, crisisResourcesFor, toCrisisSignals } from "@/lib/safety/crisis";

type CrisisCalloutProps = {
  className?: string;
  /** Detected crisis signals or categories; ranks matching lines right after 911. */
  signals?: string[];
};

export function CrisisCallout({ className, signals = [] }: CrisisCalloutProps) {
  const ranked = crisisResourcesFor(toCrisisSignals(signals));
  return (
    <section
      className={className}
      aria-labelledby="crisis-callout-title"
      role="region"
    >
      <div className="rounded-[var(--radius-lg)] border-2 border-[var(--crisis-border)] bg-[var(--crisis-bg)] p-5 sm:p-6">
        <h2
          id="crisis-callout-title"
          className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--crisis-fg)]"
        >
          You may need help right now
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--crisis-fg)]">
          {CRISIS_INTRO}
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {ranked.slice(0, 4).map((item) => (
            <li key={item.name}>
              <span className="font-medium text-[var(--crisis-fg)]">
                {item.name}:{" "}
              </span>
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-[var(--crisis-fg)] underline underline-offset-2"
                >
                  {item.contact}
                </Link>
              ) : (
                <span>{item.contact}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
