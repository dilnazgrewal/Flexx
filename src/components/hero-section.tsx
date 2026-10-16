import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-black text-white">
      <Image
        src="/images/hero_section_flex.jpg"
        alt="Flexx whey protein with chocolate splash"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_center]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

      <div className="relative z-10 flex min-h-[100svh] items-end">
        <div className="w-full px-5 pb-8 pt-32 sm:px-8 sm:pb-12 lg:px-10 lg:pb-14">
          <h1 className="max-w-[10ch] font-bold text-5xl uppercase leading-[0.82] tracking-wide text-[#928886] sm:text-7xl lg:max-w-4xl lg:text-[hrem]">
            Arise or
            <span className="block">stay down</span>
          </h1>

          <Button
            asChild
            size="lg"
            className="mt-6 w-full rounded-xl bg-[var(--brand-red)] font-bold uppercase transition hover:-translate-y-1 hover:bg-[var(--brand-red-dark)] sm:w-auto"
          >
            <Link href="#products">
              Shop Flexx
              <ArrowUpRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}