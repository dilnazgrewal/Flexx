import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideIn } from "@/components/slide-in";
import { SectionWrapper } from "./section-wrapper";

export function NewFlavourSection() {
  return (
    <SectionWrapper
      id="new-flavour" width="full"
      className="bg-[#050505] px-4 py-12 font-[var(--font-display)] sm:px-6 lg:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-8xl overflow-hidden bg-[#151515] text-white lg:relative lg:min-h-[55vh]">
        <div className="relative h-[42svh] min-h-[300px] sm:h-[48svh] lg:absolute lg:inset-0 lg:h-full">
          <Image
            src="/images/flexx-strawberry-clean-hero.jpg"
            alt="Flexx new protein flavour collection"
            fill
            className="object-contain object-right lg:object-cover lg:object-center"
            sizes="(min-width: 1024px) 1024px, 100vw"
          />

          <div className="absolute inset-0 hidden bg-gradient-to-t from-black/75 via-black/30 to-transparent lg:block" />
        </div>

        <div className="relative z-10 px-5 pb-8 pt-8 sm:px-8 sm:pb-10 lg:flex lg:min-h-[55vh] lg:items-end lg:px-10 lg:pb-14 lg:pt-32">
          <SlideIn direction="up" className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
              New flavour / limited drop
            </p>

            <h2 className="mt-4 text-5xl uppercase font-bold leading-[0.85] tracking-[0.02em] sm:text-6xl lg:text-5xl">
              Rich strawberry
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70 sm:text-base">
              Discover the new Flexx protein collection, created for powerful
              training and better recovery.
            </p>

            <span className="text-2xl font-bold">$49.99</span>
            <div className="text-black mt-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">

              <Button
                asChild
                className="w-full rounded-none bg-[var(--brand-red)] uppercase font-bold text-black transition-all hover:-translate-y-1 hover:bg-white hover:text-black sm:w-auto"
              >
                <Link href="#products">
                  Shop now
                  <ArrowUpRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </SlideIn>
        </div>
      </div>
    </SectionWrapper>
  );
}