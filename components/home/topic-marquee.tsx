"use client";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

const PIXELS_PER_SECOND = 40;

/**
 * Infinite moving band of help topics. The list renders twice and wraps after
 * the first copy scrolls past, so the loop is seamless. It pauses on hover and
 * focus and has a pause button (WCAG 2.2.2); reduced motion shows a still list.
 */
export function TopicMarquee({ topics, label }: { topics: readonly string[]; label: string }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const [paused, setPaused] = useState(false);
  const x = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    const track = trackRef.current;
    if (reduce || paused || hovering.current || !track) return;
    const loopWidth = track.scrollWidth / 2;
    if (loopWidth <= 0) return;
    let next = x.get() - (PIXELS_PER_SECOND * delta) / 1000;
    if (-next >= loopWidth) next += loopWidth;
    x.set(next);
  });

  const items = (copy: number) =>
    topics.map((topic) => (
      <li key={`${copy}-${topic}`} className="flex shrink-0 items-center gap-6 pr-6">
        {topic}
        <span aria-hidden className="size-1.5 rounded-full bg-[#13243b]/60" />
      </li>
    ));

  if (reduce) {
    return (
      <div className="bg-[var(--coral)] px-4 py-4 sm:px-6">
        <ul
          aria-label={label}
          className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-[0.16em] text-[#13243b]"
        >
          {topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="flex items-center bg-[var(--coral)]"
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      onFocus={() => (hovering.current = true)}
      onBlur={() => (hovering.current = false)}
    >
      <div className="min-w-0 flex-1 overflow-hidden py-4">
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max text-xs font-bold uppercase tracking-[0.16em] text-[#13243b]"
        >
          <ul aria-label={label} className="flex shrink-0 pl-6">
            {items(0)}
          </ul>
          <ul aria-hidden className="flex shrink-0 pl-6">
            {items(1)}
          </ul>
        </motion.div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play moving topics" : "Pause moving topics"}
        className="mx-2 grid size-11 shrink-0 place-items-center rounded-full text-[#13243b] hover:bg-[#13243b]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13243b]"
      >
        {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
      </button>
    </div>
  );
}
