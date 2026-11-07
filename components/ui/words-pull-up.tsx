"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { cn } from "@/lib/utils";

type WordsPullUpProps = {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
};

export function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
  style,
}: WordsPullUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const words = text.split(" ");

  return (
    <div
      ref={ref}
      className={cn("inline-flex flex-wrap", className)}
      style={style}
    >
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={`${word}-${i}`}
            initial={reduceMotion ? false : { y: 24, opacity: 0 }}
            animate={
              reduceMotion || isInView ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }
            }
            transition={{
              duration: 0.55,
              delay: reduceMotion ? 0 : i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative inline-block"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast ? (
              <span className="absolute top-[0.55em] -right-[0.28em] text-[0.28em]">
                *
              </span>
            ) : null}
          </motion.span>
        );
      })}
    </div>
  );
}

type Segment = {
  text: string;
  className?: string;
};

type WordsPullUpMultiStyleProps = {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
};

export function WordsPullUpMultiStyle({
  segments,
  className = "",
  style,
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div
      ref={ref}
      className={cn("inline-flex flex-wrap justify-center", className)}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w.word}-${i}`}
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={
            reduceMotion || isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }
          }
          transition={{
            duration: 0.55,
            delay: reduceMotion ? 0 : i * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn("inline-block", w.className)}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
}
