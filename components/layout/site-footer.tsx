import Link from "next/link";

import { KinoraLogo } from "@/components/layout/kinora-logo";

const FOOTER_LINKS = [
  { href: "/resources", label: "Resources" },
  { href: "/start", label: "Get started" },
  { href: "/plan", label: "My plan" },
  { href: "/community", label: "Community" },
  { href: "/stats", label: "Stats" },
] as const;

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
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
              >
                {link.label}
              </Link>
            ))}
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
