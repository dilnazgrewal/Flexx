import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Leaf, Star, Truck, Undo2 } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ReviewForm } from "@/components/review-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SlideIn } from "@/components/slide-in";
import { ApiError, getProduct, getRelatedProducts } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: `${product.name} - ${product.flavor}`,
      description: product.shortDescription,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const related = await getRelatedProducts(slug).catch(() => []);
  const gallery = product.gallery.length
    ? product.gallery
    : [product.image, product.hoverImage];

  const ratingBreakdown = [5, 4, 3, 2, 1].map((value) => ({
    value,
    count: product.reviews.filter((review) => review.rating === value).length,
  }));

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-screen bg-[var(--brand-black)] px-4 py-10 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <nav
            className="flex flex-wrap items-center gap-1.5 text-xs uppercase tracking-wider text-white/40"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3" />
            <Link href="/products" className="hover:text-white">
              Products
            </Link>
            {product.categorySlug && (
              <>
                <ChevronRight className="size-3" />
                <Link
                  href={`/products?category=${product.categorySlug}`}
                  className="hover:text-white"
                >
                  {product.categoryName}
                </Link>
              </>
            )}
            <ChevronRight className="size-3" />
            <span className="text-white/70">{product.flavor}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <SlideIn direction="left">
              <ProductGallery
                images={gallery}
                alt={`${product.name} ${product.flavor}`}
              />
            </SlideIn>

            <SlideIn direction="right">
              <div>
                {product.tag && (
                  <span className="inline-block bg-[var(--brand-red)] px-3 py-1 text-xs font-bold uppercase">
                    {product.tag}
                  </span>
                )}

                <h1 className="mt-4 text-4xl font-bold uppercase leading-[0.9] sm:text-5xl">
                  {product.name}
                </h1>
                <p className="mt-2 text-lg text-white/40">{product.flavor}</p>

                <a
                  href="#reviews"
                  className="mt-4 flex items-center gap-2 text-sm text-white/60 hover:text-white"
                >
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={
                          index < Math.round(product.rating)
                            ? "size-3.5 text-[var(--brand-red)]"
                            : "size-3.5 text-white/20"
                        }
                        fill="currentColor"
                      />
                    ))}
                  </span>
                  {product.rating} · {product.reviewCountLabel}
                </a>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-white/35 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.discountPercent ? (
                    <span className="bg-[var(--brand-red)]/15 px-3 py-1 text-sm font-bold text-[var(--brand-red)]">
                      Save {product.discountPercent}%
                    </span>
                  ) : null}
                </div>

                <p className="mt-6 text-base leading-7 text-white/60">
                  {product.shortDescription}
                </p>

                <div className="mt-7">
                  {product.inStock ? (
                    <p className="text-sm text-white/50">
                      <span className="mr-2 inline-block size-2 rounded-full bg-emerald-400" />
                      In stock
                      {product.stock <= 25 && (
                        <span className="ml-1 text-[var(--brand-red)]">
                          - only {product.stock} left
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--brand-red)]">
                      <span className="mr-2 inline-block size-2 rounded-full bg-[var(--brand-red)]" />
                      Sold out - back soon
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <AddToCartButton
                    slug={product.slug}
                    name={`${product.name} - ${product.flavor}`}
                    stock={product.stock}
                    withQuantity
                    label="Add to bag"
                  />
                </div>

                <ul className="mt-8 grid gap-3 border-t border-white/10 pt-7 text-sm text-white/50 sm:grid-cols-3">
                  <li className="flex items-center gap-2">
                    <Truck className="size-4 text-[var(--brand-red)]" />
                    Free over $50
                  </li>
                  <li className="flex items-center gap-2">
                    <Undo2 className="size-4 text-[var(--brand-red)]" />
                    30-day returns
                  </li>
                  <li className="flex items-center gap-2">
                    <Leaf className="size-4 text-[var(--brand-red)]" />
                    No fillers
                  </li>
                </ul>

                {(product.proteinPerServing > 0 || product.calories) && (
                  <dl className="mt-8 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
                    <Spec label="Protein" value={`${product.proteinPerServing}g`} />
                    {product.calories ? (
                      <Spec label="Calories" value={String(product.calories)} />
                    ) : null}
                    {product.servings ? (
                      <Spec label="Servings" value={String(product.servings)} />
                    ) : null}
                    {product.weightGrams ? (
                      <Spec label="Weight" value={`${product.weightGrams}g`} />
                    ) : null}
                  </dl>
                )}
              </div>
            </SlideIn>
          </div>

          <section className="mt-20 grid gap-12 border-t border-white/10 pt-14 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold uppercase">About this product</h2>
              <p className="mt-5 text-base leading-7 text-white/60">
                {product.description}
              </p>
            </div>

            {product.ingredients && (
              <div>
                <h2 className="text-2xl font-bold uppercase">Ingredients</h2>
                <p className="mt-5 text-base leading-7 text-white/60">
                  {product.ingredients}
                </p>
              </div>
            )}
          </section>

          <section id="reviews" className="mt-20 border-t border-white/10 pt-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
                  Customer reviews
                </p>
                <h2 className="mt-2 text-3xl font-bold uppercase">
                  {product.rating} out of 5
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  Based on {product.reviewCountLabel}
                </p>
              </div>

              <ReviewForm slug={product.slug} />
            </div>

            {product.reviews.length > 0 && (
              <div className="mt-10 grid gap-12 lg:grid-cols-[280px_1fr]">
                <div className="flex flex-col gap-2">
                  {ratingBreakdown.map((row) => {
                    const percent = product.reviews.length
                      ? (row.count / product.reviews.length) * 100
                      : 0;
                    return (
                      <div key={row.value} className="flex items-center gap-3 text-xs">
                        <span className="w-8 text-white/50">{row.value} ★</span>
                        <div className="h-1.5 flex-1 bg-white/10">
                          <div
                            className="h-full bg-[var(--brand-red)]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-white/40">{row.count}</span>
                      </div>
                    );
                  })}
                </div>

                <ul className="flex flex-col divide-y divide-white/10">
                  {product.reviews.map((review) => (
                    <li key={review.id} className="py-6 first:pt-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={
                                index < review.rating
                                  ? "size-3 text-[var(--brand-red)]"
                                  : "size-3 text-white/20"
                              }
                              fill="currentColor"
                            />
                          ))}
                        </span>
                        <span className="text-sm font-bold">{review.authorName}</span>
                        {review.isVerified && (
                          <span className="bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                            Verified
                          </span>
                        )}
                        <span className="text-xs text-white/30">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      {review.title && (
                        <p className="mt-3 font-bold">{review.title}</p>
                      )}
                      {review.body && (
                        <p className="mt-2 text-sm leading-6 text-white/55">
                          {review.body}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {related.length > 0 && (
            <section className="mt-20 border-t border-white/10 pt-14">
              <h2 className="text-3xl font-bold uppercase text-[#928886]">
                You might also like
              </h2>

              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item, index) => (
                  <SlideIn key={item.id} delay={index * 0.08}>
                    <ProductCard product={item} />
                  </SlideIn>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--brand-black)] px-4 py-4 text-center">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-white/35">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}
