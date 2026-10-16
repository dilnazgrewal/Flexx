import Image from "next/image";
import { Play } from "lucide-react";

import { SlideIn } from "@/components/slide-in";
import { TestimonialScroller } from "@/components/testimonial-scroller";
import { SectionWrapper } from "./section-wrapper";
import type { Testimonial } from "@/lib/types";

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <SectionWrapper
      id="reviews" width="full"
      className="bg-[var(--brand-black)] px-4 py-20 text-white sm:px-6 lg:px-10"
    >
      <div className="mx-auto grid max-w-8xl gap-12 lg:grid-cols-[0.8fr_1.2fr_0.9fr] lg:items-center">
        {/* Left content */}
        <SlideIn direction="left">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
              Real results
            </p>

            <h2 className="text-[#928886] text-5xl uppercase font-bold leading-none sm:text-5xl">
              Built for
              <span className="block">
                stronger days.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-6 text-white/60">
              See why athletes choose Flexx as part of their daily training
              and recovery routine.
            </p>
          </div>
        </SlideIn>

        {/* Center video placeholder */}
        <SlideIn>
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
            <Image
              src="/images/flexx-chocolat-woman-outdoor.jpg"
              alt="Flexx customer testimonial"
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/30" />

            <button
              type="button"
              aria-label="Play testimonial video"
              className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--brand-red)] transition-transform hover:scale-110"
            >
              <Play className="ml-1 size-6 fill-white" />
            </button>

            <div className="absolute bottom-5 left-5">
              <p className="text-xs font-bold uppercase tracking-widest">
                Customer story
              </p>
              <p className="mt-1 text-sm text-white/70">
                Fuel your next move.
              </p>
            </div>
          </div>
        </SlideIn>

        {/* Right testimonial slider */}
        <TestimonialScroller testimonials={testimonials} />
      </div>
    </SectionWrapper>
  );
}