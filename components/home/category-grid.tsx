"use client";

import {
  ArrowRight,
  Baby,
  BriefcaseBusiness,
  HeartHandshake,
  House,
  Users,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import type { ResourceCategory } from "@/lib/db/schema-constants";
import { stashPlanText } from "@/lib/matching/plan-text-handoff";
import { cn } from "@/lib/utils";

type SupportCategory = {
  title: string;
  body: string;
  icon: LucideIcon;
  tint: string;
  category?: ResourceCategory;
  /** For needs without their own catalog category: described to the search like a parent's own words. */
  need?: string;
};

const CATEGORIES: SupportCategory[] = [
  { title: "Childcare", body: "Licensed care, subsidies, and after-school options.", icon: Baby, tint: "bg-[var(--sky)]", category: "childcare" },
  { title: "Food", body: "Food banks, meal programs, and community kitchens.", icon: Utensils, tint: "bg-[var(--lime)]", category: "food" },
  { title: "Housing", body: "Rent help, shelters, and housing navigation.", icon: House, tint: "bg-[var(--coral)]", category: "housing" },
  { title: "Financial", body: "Benefits, subsidies, and emergency funds.", icon: Wallet, tint: "bg-[var(--sky)]", category: "financial" },
  { title: "Electricity", body: "Help with power and utility bills.", icon: Zap, tint: "bg-[var(--lime)]", category: "financial", need: "Help paying my electricity and utility bills" },
  { title: "Employment", body: "Job search help and training programs.", icon: BriefcaseBusiness, tint: "bg-[var(--coral)]", need: "Help finding work or job training as a single parent" },
  { title: "Mental wellness", body: "Counselling and family support services.", icon: HeartHandshake, tint: "bg-[var(--sky)]", category: "health_family" },
  { title: "Social groups", body: "Peer groups and parents to hang out with.", icon: Users, tint: "bg-[var(--lime)]", category: "community" },
];

const queryFor = (item: SupportCategory) =>
  new URLSearchParams(item.category ? { categories: item.category } : {}).toString();

function fallbackHref(item: SupportCategory): string {
  if (item.category) return `/plan?${queryFor(item)}`;
  return "/start?mode=needs";
}

export function CategoryGrid() {
  const router = useRouter();

  function onSelect(event: MouseEvent<HTMLAnchorElement>, item: SupportCategory) {
    if (!item.need) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const query = queryFor(item);
    stashPlanText(query, item.need);
    router.push(query ? `/plan?${query}` : "/plan");
  }

  return (
    <ul className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.title}>
            <Link
              href={fallbackHref(item)}
              onClick={(event) => onSelect(event, item)}
              className="sticker group flex h-full flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--surface)] p-5 text-[var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
            >
              <span aria-hidden className={cn("grid size-12 place-items-center rounded-full text-[#13243b]", item.tint)}>
                <Icon className="size-6" />
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">{item.title}</h3>
              <span className="text-sm leading-relaxed text-[var(--ink-muted)]">{item.body}</span>
              <span className="mt-auto flex items-center gap-1 pt-1 text-sm font-semibold text-[var(--accent)]">
                Explore
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
