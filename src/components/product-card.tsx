import Link from "next/link";
import { Star } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageSlider } from "@/components/product-image-slider";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export type { Product };

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const filledStars = Math.round(product.rating);

  return (
    <article className="group/card flex h-full flex-col text-white">
      <div className="relative">
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          <ProductImageSlider
            image={product.image}
            hoverImage={product.hoverImage}
            alt={`${product.name} ${product.flavor}`}
          />
        </Link>

        <span className="absolute left-2 top-2 bg-[var(--brand-red)] px-3 py-1 text-xs font-bold uppercase text-white">
          {product.tag ?? "Best seller"}
        </span>

        {!product.inStock && (
          <span className="absolute right-2 top-2 bg-black/80 px-3 py-1 text-xs font-bold uppercase text-white/70">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-1 flex-col">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={
                index < filledStars
                  ? "size-2 text-[var(--brand-red)]"
                  : "size-2 text-white/20"
              }
              fill="currentColor"
            />
          ))}

          <span className="ml-1 text-sm text-white/60">
            {product.rating} ({product.reviewCountLabel})
          </span>
        </div>

        <h3 className="mt-4 text-2xs font-bold uppercase tracking-tight">
          <Link href={`/products/${product.slug}`} className="hover:text-[var(--brand-red)]">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-sm text-white/30">{product.flavor}</p>

        <div className="mt-2 flex items-center gap-3">
          {product.originalPrice && (
            <span className="text-white/40 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}

          <span className="text-lg font-bold">{formatPrice(product.price)}</span>

          {product.discountPercent ? (
            <span className="font-bold text-[var(--brand-red)]">
              Save {product.discountPercent}%
            </span>
          ) : null}
        </div>

        <div className="mt-4 pt-1 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover/card:opacity-100 lg:focus-within:opacity-100">
          <AddToCartButton
            slug={product.slug}
            name={`${product.name} - ${product.flavor}`}
            stock={product.stock}
            className="py-3"
          />
        </div>
      </div>
    </article>
  );
}
