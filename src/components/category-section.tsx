import { CategoryCard } from "@/components/category-card";
import { SlideIn } from "@/components/slide-in";
import { SectionWrapper } from "./section-wrapper";
import type { Category } from "@/lib/types";

type CategorySectionProps = {
  categories: Category[];
};

export function CategorySection({ categories }: CategorySectionProps) {
  const firstRow = categories.slice(0, 3);
  const secondRow = categories.slice(3);

  return (
    <SectionWrapper
      id="categories" width="full"
      className=" px-4 py-40 font-[var(--font-display)] text-white sm:px-8 lg:px-20"
    >
      <div className="mx-auto max-w-9xl">
        <SlideIn className="mx-auto max-w-9xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
            Choose
          </p>

          <h2 className="text-[#928886] mt-2 text-4xl uppercase font-bold leading-[0.80] tracking-[0.02em] sm:text-5xl">
            Shop By Category
          </h2>

          <p className="mx-auto mt-3 max-w-lg font-sans text-base leading-6 text-white/60">
            Choose your format, from quick snacks to full-size performance
            nutrition.
          </p>
        </SlideIn>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {firstRow.map((category, index) => (
            <CategoryCard
              key={category.slug}
              category={category}
              delay={index * 0.12}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
          {secondRow.map((category, index) => (
            <CategoryCard
              key={category.slug}
              category={category}
              delay={(index + 3) * 0.12}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}