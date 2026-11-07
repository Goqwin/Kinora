"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";

import { HeroNav } from "@/components/home/hero-nav";
import { cn } from "@/lib/utils";

/** Compressed WebP of the Calgary park hero (under ~400 KB). */
const HERO_IMAGE = "/images/landing/calgary-park.webp";

const EXAMPLES = [
  "Volunteer groups with coding activities for my kid",
  "Ways to share chores with other parents nearby",
  "Affordable after-school care near me",
  "Food help and childcare for a 4 year old",
] as const;

export type HeroSeed = {
  childAgeBands?: string[];
  categories?: string[];
  openToMeetParents?: boolean;
  postal?: string;
};

type HeroProps = {
  seed?: HeroSeed;
};

export function Hero({ seed }: HeroProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [activeChip, setActiveChip] = useState<number | null>(null);

  function buildPlanUrl(text: string) {
    const params = new URLSearchParams();
    const trimmed = text.trim();
    if (trimmed) params.set("text", trimmed.slice(0, 1000));

    if (seed?.postal) params.set("postal", seed.postal);
    if (seed?.openToMeetParents) params.set("openToMeetParents", "1");
    for (const band of seed?.childAgeBands ?? []) {
      params.append("childAgeBands", band);
    }
    if (seed?.categories?.length) {
      params.set("categories", seed.categories[0] ?? "");
    }

    return `/plan?${params.toString()}`;
  }

  function go(text: string) {
    const value = text.trim();
    if (!value) return;
    router.push(buildPlanUrl(value));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text =
      q.trim() || (activeChip !== null ? EXAMPLES[activeChip] : "");
    if (!text) return;
    go(text);
  }

  return (
    <section className="bg-[var(--hero-ink)] p-2 sm:p-3">
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-[1.75rem] sm:min-h-[calc(100svh-1.5rem)] sm:rounded-[2.25rem]">
        <Image
          src={HERO_IMAGE}
          alt="Calgary skyline reflected in the Bow River in autumn"
          fill
          priority
          sizes="100vw"
          className="hero-anim-image -z-10 object-cover object-[center_35%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_72%_18%,rgba(255,170,80,0.22),transparent_55%)] mix-blend-soft-light"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#04100d]/90 via-[#04100d]/35 to-[#04100d]/55"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]"
        />
        <div
          aria-hidden
          className="hero-grain pointer-events-none absolute inset-0 -z-10"
        />

        <HeroNav />

        <div className="relative z-10 mt-auto flex flex-col gap-8 px-5 pb-6 pt-32 sm:px-10 sm:pb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <h1 className="hero-anim-wordmark select-none font-[family-name:var(--font-display)] text-[clamp(5.5rem,26vw,12rem)] font-semibold leading-[0.78] tracking-[-0.05em] text-[var(--hero-cream)] lg:text-[clamp(7rem,15vw,16rem)]">
            Kinora
            <span
              aria-hidden
              className="ml-[0.04em] inline-block size-[0.13em] -translate-y-[0.55em] rounded-full border-[0.025em] border-[var(--hero-teal)] align-top"
            />
          </h1>

          <div className="hero-anim-column w-full max-w-xl lg:w-[min(36rem,40vw)] lg:pb-2">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--hero-teal)]">
              Calgary single parents
            </p>
            <p className="mt-3 text-pretty text-base leading-relaxed text-[var(--hero-cream)]/90 sm:text-lg">
              Tell us what you need. Find childcare, benefits, food, housing,
              and other parents nearby. You do not have to figure this out
              alone.
            </p>

            <form role="search" onSubmit={onSubmit} className="mt-6">
              <label htmlFor="hero-q" className="sr-only">
                Describe what would help
              </label>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 p-1.5 pl-5 backdrop-blur-xl transition focus-within:border-[var(--hero-teal)]/70 focus-within:shadow-[0_0_0_4px_rgba(45,212,191,0.15)]">
                <Search
                  aria-hidden
                  className="size-5 shrink-0 text-[var(--hero-teal)]"
                />
                <input
                  id="hero-q"
                  name="q"
                  value={q}
                  onChange={(event) => {
                    setQ(event.target.value);
                    setActiveChip(null);
                  }}
                  maxLength={1000}
                  autoComplete="off"
                  placeholder="Describe what would help..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-white/60"
                />
                <button
                  type="submit"
                  className="group flex shrink-0 items-center gap-3 rounded-full bg-[var(--hero-cream)] py-1.5 pl-5 pr-1.5 text-sm font-medium text-[var(--hero-ink)] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-teal)]"
                >
                  <span className="hidden sm:inline">Search supports</span>
                  <span className="sm:hidden">Search</span>
                  <span className="grid size-10 place-items-center rounded-full bg-[var(--hero-ink)] text-[var(--hero-cream)] transition-transform group-hover:translate-x-0.5">
                    <ArrowRight aria-hidden className="size-4" />
                  </span>
                </button>
              </div>
            </form>

            <ul className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
              {EXAMPLES.map((text, index) => (
                <li key={text} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChip(index);
                      setQ(text);
                      go(text);
                    }}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm backdrop-blur transition",
                      activeChip === index
                        ? "border-[var(--hero-teal)] bg-[var(--hero-teal)]/20 text-white"
                        : "border-white/20 bg-black/30 text-white/90 hover:border-white/40 hover:bg-white/10",
                    )}
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
              <Link
                href="/resources"
                className="underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-teal)]"
              >
                Browse verified catalog
              </Link>
              <Link
                href="/start"
                className="underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-teal)]"
              >
                Use filters instead
              </Link>
              <span className="text-white/60">
                No account needed. Crisis help stays in the header.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
