"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { KinoraLogo } from "@/components/layout/kinora-logo";
import { CrisisPanel } from "@/components/safety/crisis-panel";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/resources", label: "Resources" },
  { href: "/plan", label: "My plan" },
  { href: "/community", label: "Community" },
  { href: "/saved", label: "Saved" },
  { href: "/stats", label: "Stats" },
] as const;

export function HeroNav() {
  const pathname = usePathname();

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="relative mx-auto flex w-full max-w-7xl items-start justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 text-[var(--hero-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <KinoraLogo
            showWordmark
            tagline="Connections Closer to Home."
            markClassName="size-9 text-[var(--hero-cream)]"
            wordmarkClassName="text-[var(--hero-cream)]"
            taglineClassName="text-[var(--hero-cream)]/70"
          />
        </Link>

        <nav
          aria-label="Main"
          className="hero-notch absolute left-1/2 top-0 hidden -translate-x-1/2 items-center gap-1 px-3 pb-3 pt-3 md:flex"
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-teal)]",
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <ThemeToggle className="border-white/20 bg-black/35 text-[var(--hero-cream)] hover:bg-black/50" />
          </div>
          <CrisisPanel
            trigger={
              <Button
                type="button"
                size="sm"
                className="rounded-full border border-white/25 bg-[var(--hero-cream)] px-3 text-[var(--hero-ink)] shadow-none hover:bg-white"
              >
                Need help now?
              </Button>
            }
          />
          <Link
            href="/account"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--hero-cream)]/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-teal)] md:inline-block"
          >
            Account
          </Link>

          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur md:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav aria-label="Mobile" className="mt-10 flex flex-col gap-1">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-4 py-3 text-lg text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex items-center gap-3 px-4">
                <ThemeToggle />
                <Link
                  href="/account"
                  className="rounded-full px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                >
                  Account
                </Link>
              </div>
              <p className="mt-4 px-4 text-xs text-[var(--ink-muted)]">
                Crisis help stays on Need help now? in the header.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
