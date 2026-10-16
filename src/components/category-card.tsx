import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SlideIn } from "@/components/slide-in";
import type { Category } from "@/lib/types";

type CategoryCardProps = {
    category: Category;
    delay?: number;
    className?: string;
};

export function CategoryCard({
    category,
    delay = 0,
    className = "",
}: CategoryCardProps) {
    return (
        <SlideIn delay={delay} className={className}>
            <Link
                href={`/products?category=${category.slug}`}
                className="group grid min-h-[200px] grid-cols-1 overflow-hidden bg-[var(--brand-black)] text-white sm:grid-cols-[48%_52%]"
            >
                <div className="relative h-56 bg-[var(--brand-black)] sm:h-full">
                    <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(min-width: 768px) 42vw, 100vw"
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        style={{
                            objectPosition: category.imagePosition ?? "center",
                        }}
                    />
                </div>

                <div className="flex min-h-[220px] flex-col justify-between bg-[var(--brand-black)] p-5 sm:min-h-0 sm:p-6">
                    <div>
                        <h3 className="font-[var(--font-display)] text-2xl font-bold uppercase leading-none tracking-wide">
                            {category.name}
                        </h3>

                        <p className="mt-3 max-w-[220px] text-sm font-bold leading-5 text-white/65">
                            {category.description}
                        </p>

                        <p className="mt-2 text-xs uppercase tracking-widest text-white/35">
                            {category.productCount} product{category.productCount === 1 ? "" : "s"}
                        </p>
                    </div>

                    <span className="text-black group/button mt-6 inline-flex w-fit items-center gap-2 bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase text-black transition-colors duration-200 hover:bg-[var(--brand-red-dark)]">
                        Shop now

                        <ArrowUpRight className="size-4 transition-transform duration-200 group-hover/button:translate-x-1 group-hover/button:-translate-y-1" />
                    </span>
                </div>
            </Link>
        </SlideIn>
    );
}