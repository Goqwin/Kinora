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

const NAV_LINKS = [
  { href: "/resources", label: "Resources" },
  { href: "/plan", label: "My plan" },
  { href: "/community", label: "Community" },
  { href: "/saved", label: "Saved" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--canvas)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6">
        <Link
          href="/"
          className="group min-w-0 rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
          aria-label="Kinora home"
        >
          <KinoraLogo
            tagline="Calgary single parents"
            markClassName="h-8 w-8 transition-colors group-hover:text-[var(--accent-hover)]"
            wordmarkClassName="text-[1.05rem] transition-colors group-hover:text-[var(--accent)] sm:text-lg"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 p-1 shadow-[var(--shadow-xs)] md:flex"
          aria-label="Main"
        >
          {NAV_LINKS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  active
                    ? "bg-[var(--ink)] text-[var(--canvas)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <CrisisPanel
            trigger={
              <Button
                type="button"
                size="sm"
                variant="crisis"
                className="rounded-full"
              >
                Need help now?
              </Button>
            }
          />
          <Link
            href="/account"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] sm:inline-block"
          >
            Account
          </Link>

          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] md:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav aria-label="Mobile" className="mt-10 flex flex-col gap-1">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3 text-lg text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/account"
                  className="rounded-xl px-4 py-3 text-lg text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                >
                  Account
                </Link>
              </nav>
              <div className="mt-6 px-4">
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
