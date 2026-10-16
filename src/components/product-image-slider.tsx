"use client";

import Image from "next/image";
import { motion } from "motion/react";

type ProductImageSliderProps = {
  image: string;
  hoverImage: string;
  alt: string;
};

export function ProductImageSlider({
  image,
  hoverImage,
  alt,
}: ProductImageSliderProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      className="relative aspect-square overflow-hidden bg-[#111111]"
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-contain p-0"
      />

      <motion.div
        variants={{
          rest: { x: "100%" },
          hover: { x: 0 },
        }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="pointer-events-none absolute inset-0"
      >
        <Image
          src={hoverImage}
          alt={`${alt} alternative view`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-contain bg-[#111111] p-0"
        />
      </motion.div>
    </motion.div>
  );
}