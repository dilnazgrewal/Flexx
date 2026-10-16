import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

import { ApiOfflineNotice } from "@/components/api-offline-notice";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SlideIn } from "@/components/slide-in";
import { getCategories, getProducts, type ProductQuery } from "@/lib/api";

export const metadata: Metadata = {
  title: "All Products",
  description: "Every Flexx protein tub, bar, refill pack and shaker in one place.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(first(params.page) ?? 1) || 1;

  const query: ProductQuery = {
    category: first(params.category),
    search: first(params.search),
    sort: (first(params.sort) as ProductQuery["sort"]) ?? "featured",
    inStock: first(params.inStock) === "true" ? true : undefined,
    page,
    pageSize: 12,
  };

  const [result, categories] = await Promise.all([
    getProducts(query).catch(() => null),
    getCategories().catch(() => []),
  ]);

  if (!result) {
    return (
      <>
        <SiteHeader variant="solid" />
        <ApiOfflineNotice />
        <SiteFooter />
      </>
    );
  }

  const activeCategory = categories.find((c) => c.slug === query.category);

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-screen bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SlideIn>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
              Shop Flexx
            </p>
            <h1 className="mt-2 text-4xl font-bold uppercase leading-[0.85] text-[#928886] sm:text-6xl">
              {activeCategory ? activeCategory.name : "All Products"}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/50">
              {activeCategory
                ? activeCategory.description
                : "Protein tubs, bars, refill packs and shakers. Free shipping over $50, 30-day flavour guarantee."}
            </p>
          </SlideIn>

          <div className="mt-10">
            <Suspense fallback={<div className="h-40" />}>
              <ProductFilters categories={categories} total={result.total} />
            </Suspense>
          </div>

          {result.items.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-2xl font-bold uppercase text-white/70">
                Nothing matches those filters
              </p>
              <p className="mt-3 text-sm text-white/40">
                Try a different category or clear your search.
              </p>
              <Link
                href="/products"
                className="mt-8 inline-block bg-[var(--brand-red)] px-8 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)]"
              >
                Show everything
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {result.items.map((product, index) => (
                <SlideIn key={product.id} delay={Math.min(index, 7) * 0.06}>
                  <ProductCard product={product} />
                </SlideIn>
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav
              className="mt-16 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {Array.from({ length: result.pages }).map((_, index) => {
                const target = index + 1;
                const next = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                  const v = first(value);
                  if (v && key !== "page") next.set(key, v);
                });
                if (target > 1) next.set("page", String(target));
                const qs = next.toString();

                return (
                  <Link
                    key={target}
                    href={qs ? `/products?${qs}` : "/products"}
                    aria-current={target === result.page ? "page" : undefined}
                    className={`flex size-10 items-center justify-center border text-sm font-bold transition ${
                      target === result.page
                        ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
                        : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {target}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
