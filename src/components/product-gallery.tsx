"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const gallery = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[activeIndex] ?? gallery[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden bg-[#111111]">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={active}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain"
          />
        </motion.div>
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`relative aspect-square overflow-hidden border bg-[#111111] transition ${
                index === activeIndex
                  ? "border-[var(--brand-red)]"
                  : "border-white/10 hover:border-white/40"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="120px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
