"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import * as React from "react";

import { WordsPullUp } from "@/components/ui/words-pull-up";
import { stashPlanText } from "@/lib/plan-text-handoff";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Volunteer groups with coding activities for my kid",
  "Ways to share chores with other parents nearby",
  "Affordable after-school care near me",
  "Food help and childcare for a 4 year old",
] as const;

export type KinoraHeroSeed = {
  childAgeBands?: string[];
  categories?: string[];
  openToMeetParents?: boolean;
  postal?: string;
};

type KinoraHeroProps = {
  seed?: KinoraHeroSeed;
};

export function KinoraHero({ seed }: KinoraHeroProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = React.useState("");
  const [activeChip, setActiveChip] = React.useState<number | null>(null);

  // The free text never goes in the URL; it is handed to /plan via sessionStorage.
  function buildPlanUrl(text: string) {
    const params = new URLSearchParams();
    if (seed?.postal) params.set("postal", seed.postal);
    if (seed?.openToMeetParents) params.set("openToMeetParents", "1");
    for (const band of seed?.childAgeBands ?? []) {
      params.append("childAgeBands", band);
    }
    if (seed?.categories?.length) {
      params.set("categories", seed.categories[0] ?? "");
    }

    const queryString = params.toString();
    stashPlanText(queryString, text);
    return queryString ? `/plan?${queryString}` : "/plan";
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text =
      query.trim() ||
      (activeChip !== null ? EXAMPLE_PROMPTS[activeChip] : "");
    if (!text) return;
    router.push(buildPlanUrl(text));
  }

  function applyChip(index: number) {
    setActiveChip(index);
    setQuery(EXAMPLE_PROMPTS[index]);
  }

  return (
    <section className="relative isolate w-full overflow-hidden border-b border-[var(--border)]">
      <div className="relative min-h-[min(92svh,44rem)] w-full overflow-hidden">
        <Image
          src="/images/landing/calgary-park.jpg"
          alt="Calgary skyline reflected in the Bow River in autumn"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay" />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgb(8_24_22/0.88)] via-[rgb(8_24_22/0.55)] to-[rgb(8_24_22/0.2)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgb(8_24_22/0.75)] via-transparent to-[rgb(8_24_22/0.35)]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[min(92svh,44rem)] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
          <motion.p
            initial={reduceMotion ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs font-semibold tracking-[0.22em] text-[#5fd4c8] uppercase sm:text-sm"
          >
            Calgary single parents
          </motion.p>

          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.04em] text-[#e8f4f1] sm:mt-5 sm:text-6xl lg:text-[4.25rem]">
            <WordsPullUp text="Kinora" />
          </h1>

          <motion.p
            initial={reduceMotion ? false : { y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg"
          >
            Tell us what you need. Find childcare, benefits, food, housing, and
            ways to connect with other parents. You do not have to figure this
            out alone.
          </motion.p>

          <motion.form
            onSubmit={onSubmit}
            initial={reduceMotion ? false : { y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 w-full max-w-2xl sm:mt-10"
          >
            <label htmlFor="kinora-search" className="sr-only">
              Search for support
            </label>
            <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/20 bg-white/10 p-2 shadow-[0_20px_50px_rgb(0_0_0/0.25)] backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full sm:p-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 sm:px-4">
                <Search
                  className="h-5 w-5 shrink-0 text-[#5fd4c8]"
                  aria-hidden
                />
                <input
                  id="kinora-search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveChip(null);
                  }}
                  maxLength={1000}
                  placeholder="Describe what would help..."
                  className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/55 outline-none"
                />
              </div>
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition-all hover:gap-3 sm:shrink-0"
              >
                Search supports
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] transition-transform group-hover:scale-110">
                  <ArrowRight className="h-4 w-4 text-[#e8f4f1]" aria-hidden />
                </span>
              </button>
            </div>
          </motion.form>

          <motion.div
            initial={reduceMotion ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 flex flex-wrap gap-2"
          >
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={prompt}
                type="button"
                onClick={() => applyChip(index)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left text-xs transition-colors sm:text-sm",
                  activeChip === index
                    ? "border-[#5fd4c8] bg-[#5fd4c8]/15 text-white"
                    : "border-white/25 bg-white/5 text-white/80 hover:border-white/45 hover:text-white",
                )}
              >
                {prompt}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70"
          >
            <Link
              href="/resources"
              className="underline-offset-4 hover:text-white hover:underline"
            >
              Browse verified catalog
            </Link>
            <span aria-hidden className="text-white/30">
              ·
            </span>
            <Link
              href="/start"
              className="underline-offset-4 hover:text-white hover:underline"
            >
              Use filters instead
            </Link>
            <span aria-hidden className="text-white/30">
              ·
            </span>
            <p className="text-white/60">
              No account needed to search. Crisis help stays in the header.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
