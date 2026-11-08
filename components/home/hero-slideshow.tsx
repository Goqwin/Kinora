"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/images/landing/parent-walk.jpg", position: "center 55%" },
  { src: "/images/landing/calgary-park.webp", position: "center 35%" },
  { src: "/images/landing/parent-child.jpg", position: "center 40%" },
  { src: "/images/landing/parent-grocery.jpg", position: "center 35%" },
] as const;

const HOLD_MS = 7000;
const FADE_S = 1.6;
const ZOOM_FROM = 1.12;

/**
 * Decorative background: crossfading family photos with a slow zoom-out, like
 * a film. Auto-advancing content has a pause control (WCAG 2.2.2), and reduced
 * motion shows the first photo, still.
 */
export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reduce;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), HOLD_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {SLIDES.map((slide, i) => {
          const active = i === (reduce ? 0 : index);
          return (
            <motion.div
              key={slide.src}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: active ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : FADE_S, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ scale: active && playing ? 1 : reduce ? 1 : ZOOM_FROM }}
                transition={
                  active && playing
                    ? { duration: HOLD_MS / 1000 + FADE_S, ease: "linear" }
                    : { duration: 0, delay: reduce ? 0 : FADE_S }
                }
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: slide.position }}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {reduce ? null : (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play background slideshow" : "Pause background slideshow"}
          className="absolute right-4 top-24 z-20 grid size-11 place-items-center rounded-full border border-white/30 bg-[rgb(10_30_48/0.7)] text-white backdrop-blur-sm hover:bg-[rgb(10_30_48/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:right-6"
        >
          {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
        </button>
      )}
    </>
  );
}
