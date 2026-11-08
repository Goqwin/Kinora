"use client";

import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

export type Place = { index: string; title: string; body: string; href: string; image: string; alt: string };

const GAP = 20;
const TINTS = ["bg-[var(--sky)]", "bg-[var(--coral)]", "bg-[var(--lime)]"] as const;
const perViewFor = (width: number) => (width >= 1024 ? 3 : width >= 640 ? 2 : 1);

export function PlacesCarousel({ places }: { places: readonly Place[] }) {
  const reduce = useReducedMotion();
  const slideRef = useRef<HTMLLIElement>(null);
  const dragged = useRef(false);
  const x = useMotionValue(0);
  const [perView, setPerView] = useState(1);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);

  const maxIndex = Math.max(0, places.length - perView);
  const current = Math.min(index, maxIndex);
  const spring = useMemo(() => (reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 32 }), [reduce]);

  useEffect(() => {
    const update = () => {
      setPerView(perViewFor(window.innerWidth));
      setStep((slideRef.current?.offsetWidth ?? 0) + GAP);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const controls = animate(x, -current * step, spring);
    return () => controls.stop();
  }, [current, step, x, spring]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(next, maxIndex));
    if (clamped === current) animate(x, -current * step, spring);
    setIndex(clamped);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    go(swipe < -60 ? current + 1 : swipe > 60 ? current - 1 : current);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(current + 1);
    if (event.key === "ArrowLeft") go(current - 1);
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragged.current = false;
  };

  return (
    <section aria-roledescription="carousel" aria-label="Places to start" onKeyDown={onKeyDown} className="mt-8">
      <div className="overflow-hidden py-2 pl-1 pr-3">
        <motion.ul
          className="places-track flex cursor-grab active:cursor-grabbing"
          style={{ x, gap: GAP }}
          drag="x"
          dragConstraints={{ left: -maxIndex * step, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onPointerDown={() => (dragged.current = false)}
          onDragStart={() => (dragged.current = true)}
          onDragEnd={onDragEnd}
          onClickCapture={onClickCapture}
        >
          {places.map((place, i) => {
            const visible = i >= current && i < current + perView;
            return (
              <li
                key={place.index}
                ref={i === 0 ? slideRef : undefined}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${places.length}: ${place.title}`}
                inert={!visible}
                className="w-[85%] shrink-0 sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]"
              >
                <Link
                  href={place.href}
                  draggable={false}
                  className="sticker group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden border-b-2 border-[var(--ink)]">
                    <Image src={place.image} alt={place.alt} fill sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw" draggable={false} className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className={cn("flex flex-1 flex-col gap-2 p-5 text-[#10323c]", TINTS[i % TINTS.length])}>
                    <span className="grid size-9 place-items-center rounded-full bg-white/75 font-[family-name:var(--font-display)] text-sm font-semibold">{place.index}</span>
                    <span className="font-[family-name:var(--font-display)] text-xl font-semibold">{place.title}</span>
                    <span className="text-sm leading-relaxed text-[#10323c]/85">{place.body}</span>
                    <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-bold">
                      Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </motion.ul>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show place ${i + 1}`}
              aria-current={i === current}
              className={cn(
                "h-3 rounded-full border-2 border-[var(--ink)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                i === current ? "w-8 bg-[var(--coral)]" : "w-3 bg-[var(--surface)]",
              )}
            />
          ))}
        </div>
        <div className="flex gap-3">
          {[
            { label: "Previous places", icon: ArrowLeft, target: current - 1, disabled: current === 0 },
            { label: "Next places", icon: ArrowRight, target: current + 1, disabled: current === maxIndex },
          ].map(({ label, icon: Icon, target, disabled }) => (
            <button
              key={label}
              type="button"
              onClick={() => go(target)}
              disabled={disabled}
              aria-label={label}
              className="sticker grid size-12 place-items-center rounded-full bg-[var(--lime)] text-[#10323c] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
            >
              <Icon className="size-5" aria-hidden />
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing places {current + 1} to {Math.min(current + perView, places.length)} of {places.length}
      </p>
    </section>
  );
}
