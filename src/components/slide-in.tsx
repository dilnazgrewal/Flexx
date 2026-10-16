"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

type SlideDirection = "left" | "right" | "up" | "down";

type SlideInProps = {
  children: ReactNode;
  direction?: SlideDirection;
  delay?: number;
  duration?: number;
  className?: string;
};

const directionOffset = {
  left: { x: -60, y: 0 },
  right: { x: 60, y: 0 },
  up: { x: 0, y: 60 },
  down: { x: 0, y: -60 },
};

export function SlideIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  className,
}: SlideInProps) {
  const offset = directionOffset[direction];

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}