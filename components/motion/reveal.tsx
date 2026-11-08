"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const OFFSET = { left: { x: -48 }, right: { x: 48 }, up: { y: 32 } } as const;

type Props = { children: ReactNode; className?: string; from?: keyof typeof OFFSET; delay?: number };

export function Reveal({ children, className, from = "up", delay = 0 }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : OFFSET[from]}
      whileInView={{ x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 110, damping: 18, delay }}
    >
      {children}
    </motion.div>
  );
}
