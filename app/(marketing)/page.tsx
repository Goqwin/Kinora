import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Hero, type HeroSeed } from "@/components/home/hero";
import { Button } from "@/components/ui/button";
import { getOptionalUser, isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getPreferencesByUserId } from "@/lib/db/queries/preferences";
import { cn } from "@/lib/utils";

const VALUE_CARDS = [
  {
    index: "01",
    title: "Verified, sourced, dated.",
    body: "Every resource shows where it came from and when we checked it.",
  },
  {
    index: "02",
    title: "Your plan in about a minute.",
    body: "Describe your situation and get 3 to 4 clear next steps.",
  },
  {
    index: "03",
    title: "Parents helping parents.",
    body: "Ask questions and share ideas in a moderated community.",
  },
] as const;

const SUPPORT_AREAS = [
  {
    index: "01",
    title: "Childcare",
    body: "Licensed care, subsidies, and after-school options near you.",
    href: "/start?mode=nearby",
    image: "/images/landing/parent-walk.jpg",
    alt: "A parent and child walking together on a park path",
  },
  {
    index: "02",
    title: "Money and benefits",
    body: "Aid programs and ways to ease month-to-month pressure.",
    href: "/start?mode=needs",
    image: "/images/landing/parent-grocery.jpg",
    alt: "A parent and child carrying groceries home together",
  },
  {
    index: "03",
    title: "Food and groceries",
    body: "Food banks, meal programs, and community kitchens.",
    href: "/resources",
    image: "/images/landing/groceries.jpg",
    alt: "Fresh produce at a community market stall",
  },
  {
    index: "04",
    title: "Housing",
    body: "Shelters, rent help, and housing navigation.",
    href: "/resources",
    image: "/images/landing/calgary-day.jpg",
    alt: "Calgary skyline across open ground on a clear day",
  },
  {
    index: "05",
    title: "From other parents",
    body: "Community posts are opinions, not verified listings.",
    href: "/community",
    image: "/images/landing/parent-child.jpg",
    alt: "A parent holding a child while walking outdoors",
  },
] as const;

async function loadHeroSeed(): Promise<HeroSeed | undefined> {
  if (!isAuthConfigured() || !isDatabaseConfigured()) return undefined;
  const user = await getOptionalUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(user.id)) return undefined;
  try {
    const prefs = await getPreferencesByUserId(user.id);
    if (!prefs) return undefined;
    return {
      childAgeBands: prefs.childAgeBands ?? undefined,
      categories: prefs.categories ?? undefined,
      openToMeetParents: prefs.openToMeetParents,
      postal: prefs.postalFsa ?? undefined,
    };
  } catch {
    return undefined;
  }
}

async function HomeHero() {
  const seed = await loadHeroSeed();
  return <Hero seed={seed} />;
}

export default function HomePage() {
  return (
    <div className="flex flex-col bg-[var(--hero-ink)]">
      <Suspense fallback={<Hero />}>
        <HomeHero />
      </Suspense>

      <section className="bg-[var(--canvas)] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-3 sm:gap-5">
          {VALUE_CARDS.map((card) => (
            <article
              key={card.index}
              className="value-card-rise rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {card.index}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl bg-[var(--canvas)] px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:pb-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              What we help with
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              Start anywhere. One step is enough.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)] sm:pb-1">
            Search in plain language above, or browse these paths. Eligibility is
            always potentially eligible until a provider confirms.
          </p>
        </div>

        <ul className="mt-2 divide-y divide-[var(--border)]">
          {SUPPORT_AREAS.map((area) => (
            <li key={area.index}>
              <Link
                href={area.href}
                className={cn(
                  "landing-row-link group flex items-center gap-4 py-6 sm:gap-7 sm:py-7",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]",
                )}
              >
                <span className="relative hidden h-[4.5rem] w-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-xs)] sm:block sm:h-24 sm:w-36">
                  <Image
                    src={area.image}
                    alt={area.alt}
                    fill
                    sizes="144px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="w-9 shrink-0 tabular-nums text-sm font-medium tracking-tight text-[var(--ink-muted)] sm:w-11 sm:text-base">
                  {area.index}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)] sm:text-2xl">
                      {area.title}
                    </span>
                    <ArrowUpRight
                      className="h-5 w-5 shrink-0 text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
                    {area.body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-2">
          <div className="relative min-h-[17rem] border-b border-[var(--border)] lg:min-h-[24rem] lg:border-b-0 lg:border-r">
            <Image
              src="/images/landing/parent-child.jpg"
              alt="A parent holding a young child outdoors in soft evening light"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[center_42%]"
            />
          </div>
          <div className="flex flex-col justify-center gap-7 px-4 py-12 sm:px-10 sm:py-16 lg:px-12">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                Verified catalog
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
                Browse resources with sources and dates
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-[0.95rem]">
                Each listing includes a source link and last verified date.
                Verified resources stay in the catalog. Community posts stay
                labeled as parent opinions and never mix into your plan
                automatically.
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="w-fit rounded-[var(--radius-pill)] border border-[var(--border-strong)] shadow-[var(--shadow-brutal-sm)]"
            >
              <Link href="/resources">
                Open resource catalog
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/landing/calgary-skyline.jpg"
          alt="Looking down the Bow River toward downtown Calgary"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[rgb(10_28_26/0.68)]"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:px-6 sm:py-20">
          <div className="max-w-lg">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
              You made it here. That counts.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">
              Take the next step when you are ready. No pressure to sign in
              until you want to save items or post in the community.
            </p>
          </div>
          <Link
            href="/start"
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-[var(--ink)]",
              "transition-colors hover:bg-[var(--canvas)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(10_28_26)]",
            )}
          >
            Start with filters
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <p className="mx-auto max-w-6xl bg-[var(--canvas)] px-4 py-5 text-xs text-[var(--ink-muted)] sm:px-6">
        Photos from{" "}
        <a
          href="https://commons.wikimedia.org/"
          className="underline underline-offset-2 hover:text-[var(--ink)]"
          rel="noopener noreferrer"
          target="_blank"
        >
          Wikimedia Commons
        </a>
        . See{" "}
        <a
          href="/images/landing/CREDITS.md"
          className="underline underline-offset-2 hover:text-[var(--ink)]"
        >
          credits
        </a>
        .
      </p>
    </div>
  );
}
