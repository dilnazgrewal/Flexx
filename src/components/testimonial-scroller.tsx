"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Testimonial } from "@/lib/types";

export type { Testimonial };

type TestimonialScrollerProps = {
  testimonials: Testimonial[];
};

export function TestimonialScroller({
  testimonials,
}: TestimonialScrollerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  const visibleReviews = [-1, 0, 1].map((offset) => {
    const index =
      (activeIndex + offset + testimonials.length) % testimonials.length;

    return {
      review: testimonials[index],
      offset,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence initial={false} mode="popLayout">
        {visibleReviews.map(({ review, offset }) => (
          <motion.article
            key={`${review.id}-${offset}`}
            layout
            initial={{ opacity: 0, y: 25 }}
            animate={{
              opacity: offset === 0 ? 1 : 0.5,
              scale: offset === 0 ? 1 : 0.96,
            }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className={`min-h-[125px] rounded-xl border p-4 ${
              offset === 0
                ? "border-white/20 bg-white/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="text-sm text-[var(--brand-red)]">
              {"★".repeat(review.rating)}
            </div>

            <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/75">
              “{review.review}”
            </p>

            <div className="mt-3">
              <p className="text-sm font-bold">{review.name}</p>
              <p className="text-xs text-white/50">{review.role}</p>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}