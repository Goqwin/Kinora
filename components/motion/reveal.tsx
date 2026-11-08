"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const OFFSET = { left: { x: -48 }, right: { x: 48 }, up: { y: 32 } } as const;

type Props = { children: ReactNode; className?: string; from?: keyof typeof OFFSET; delay?: number };

export function Reveal({ children, className, from = "up", delay = 0 }: Props) {
  const reduce = useReducedMotion();
  // The server cannot know the motion preference, so the starting offset must be
  // the same on both sides; reduced motion makes the move instant instead of skipping it.
  return (
    <motion.div
      className={className}
      initial={OFFSET[from]}
      whileInView={{ x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 18, delay }}
    >
      {children}
    </motion.div>
  );
}
