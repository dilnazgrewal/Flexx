"use client";

import Link from "next/link";
import { useState } from "react";

import { ProductCard, type Product } from "@/components/product-card";
import { SlideIn } from "@/components/slide-in";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./section-wrapper";

type AllProductsProps = {
  products: Product[];
};

const PRODUCTS_PER_LOAD = 8;

export function AllProducts({ products }: AllProductsProps) {
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_LOAD);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;

  function handleLoadMore() {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + PRODUCTS_PER_LOAD, products.length),
    );
  }

  return (
    <SectionWrapper
      id="all-products" width="wide"
      className="bg-[var(--brand-black)] px-6 py-20 font-[var(--font-display)] text-white lg:px-10"
    >
      <div className="mx-auto max-w-8xl">
        <SlideIn className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
            Shop Flexx
          </p>

          <h2 className="text-[#928886] mt-2 text-3xl uppercase font-bold leading-[0.85] sm:text-5xl">
            All products
          </h2>
        </SlideIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <SlideIn key={product.id} delay={index * 0.08}>
              <ProductCard product={product} />
            </SlideIn>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {hasMoreProducts && (
            <Button
              type="button"
              onClick={handleLoadMore}
              className="rounded-none bg-[var(--brand-red)] px-8 uppercase text-white hover:bg-[var(--brand-red-dark)]"
            >
              Load more
            </Button>
          )}

          <Link
            href="/products"
            className="border border-white/15 px-8 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Browse with filters
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}