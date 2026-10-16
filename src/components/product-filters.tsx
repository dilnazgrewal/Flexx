"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

import type { Category } from "@/lib/types";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name A-Z" },
];

type ProductFiltersProps = {
  categories: Category[];
  total: number;
};

export function ProductFilters({ categories, total }: ProductFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const activeCategory = params.get("category") ?? "";
  const activeSort = params.get("sort") ?? "featured";
  const activeSearch = params.get("search") ?? "";
  const inStockOnly = params.get("inStock") === "true";

  const [searchValue, setSearchValue] = useState(activeSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(activeSearch);

  // Re-sync the input when the URL changes (back button, chip click).
  if (lastUrlSearch !== activeSearch) {
    setLastUrlSearch(activeSearch);
    setSearchValue(activeSearch);
  }

  function push(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    });
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  }

  const hasFilters = Boolean(activeCategory || activeSearch || inStockOnly);

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          push({ search: searchValue.trim() || null });
        }}
        className="relative max-w-md"
        role="search"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search tubs, bars, shakers..."
          aria-label="Search products"
          className="w-full border border-white/15 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[var(--brand-red)]"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={!activeCategory}
          onClick={() => push({ category: null })}
          label="All"
        />
        {categories.map((category) => (
          <FilterChip
            key={category.slug}
            active={activeCategory === category.slug}
            onClick={() => push({ category: category.slug })}
            label={`${category.name} (${category.productCount})`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
        <p className="text-sm text-white/50">
          <span className="font-bold text-white">{total}</span> product
          {total === 1 ? "" : "s"}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => push({ inStock: event.target.checked ? "true" : null })}
              className="size-4 accent-[var(--brand-red)]"
            />
            In stock only
          </label>

          <label className="flex items-center gap-2 text-sm text-white/60">
            Sort
            <select
              value={activeSort}
              onChange={(event) => push({ sort: event.target.value })}
              aria-label="Sort products"
              className="border border-white/15 bg-[#0d0d0d] px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand-red)]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push("/products", { scroll: false })}
              className="flex items-center gap-1 text-sm text-[var(--brand-red)] transition hover:text-white"
            >
              <X className="size-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
        active
          ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
          : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
