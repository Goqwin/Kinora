import Link from "next/link";

import { KinoraLogo } from "@/components/brand/kinora-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--canvas-deep)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-4">
            <KinoraLogo markClassName="h-7 w-7" wordmarkClassName="text-base" />
            <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
              Kinora helps single parents in Calgary explore verified supports.
              It does not guarantee eligibility or approval. Community posts are
              opinions, not verified information.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium"
            aria-label="Footer"
          >
            <Link
              href="/resources"
              className="text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
            >
              Resources
            </Link>
            <Link
              href="/start"
              className="text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
            >
              Get started
            </Link>
            <Link
              href="/plan"
              className="text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
            >
              My plan
            </Link>
            <Link
              href="/community"
              className="text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
            >
              Community
            </Link>
          </nav>
        </div>
        <p className="mt-12 border-t border-[var(--border)] pt-6 text-xs leading-relaxed text-[var(--ink-muted)]">
          Always confirm details with the provider before you act. Crisis help
          stays available from Need help now? on every page.
        </p>
      </div>
    </footer>
  );
}
