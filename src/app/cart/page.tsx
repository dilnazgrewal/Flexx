"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const {
    cart,
    isLoading,
    isMutating,
    updateItem,
    removeItem,
    clear,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");

  const items = cart?.items ?? [];
  const totals = cart?.totals;

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-[70vh] bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-4xl font-bold uppercase leading-none text-[#928886] sm:text-5xl">
            Your bag
          </h1>

          {isLoading ? (
            <div className="flex items-center gap-3 py-24 text-white/40">
              <Loader2 className="size-5 animate-spin" />
              Loading your bag...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-24 text-center">
              <ShoppingBag className="size-12 text-white/15" />
              <p className="text-2xl font-bold uppercase text-white/70">
                Your bag is empty
              </p>
              <p className="max-w-sm text-sm text-white/40">
                Nothing in here yet. Pick a tub, a box of bars or a shaker and it will
                show up on this page.
              </p>
              <Link
                href="/products"
                className="mt-2 bg-[var(--brand-red)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
              <section>
                <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-5 py-6">
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative size-28 shrink-0 overflow-hidden bg-[#111111] sm:size-32"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="128px"
                          className="object-contain"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              className="block truncate text-base font-bold uppercase hover:text-[var(--brand-red)]"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-0.5 text-sm text-white/40">{item.flavor}</p>
                            <p className="mt-2 text-sm text-white/50">
                              {formatPrice(item.unitPrice)} each
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => void removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="text-white/30 transition hover:text-[var(--brand-red)] disabled:opacity-40"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                          <div className="flex items-center border border-white/15">
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => void updateItem(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="flex size-9 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isMutating || item.quantity >= item.stock}
                              onClick={() => void updateItem(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="flex size-9 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>

                          <span className="text-lg font-bold">
                            {formatPrice(item.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href="/products"
                    className="text-xs font-bold uppercase tracking-widest text-white/50 transition hover:text-white"
                  >
                    ← Continue shopping
                  </Link>

                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => void clear()}
                    className="text-xs font-bold uppercase tracking-widest text-white/40 transition hover:text-[var(--brand-red)] disabled:opacity-40"
                  >
                    Empty bag
                  </button>
                </div>
              </section>

              <aside className="h-fit border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-28">
                <h2 className="text-lg font-bold uppercase">Order summary</h2>

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!couponInput.trim()) return;
                    try {
                      await applyCoupon(couponInput.trim());
                      setCouponInput("");
                    } catch {
                      /* toast already shown */
                    }
                  }}
                  className="mt-5"
                >
                  <label
                    htmlFor="coupon"
                    className="text-xs font-bold uppercase tracking-widest text-white/40"
                  >
                    Promo code
                  </label>

                  {cart?.couponCode ? (
                    <div className="mt-2 flex items-center justify-between border border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-bold text-[var(--brand-red)]">
                        <Tag className="size-4" />
                        {cart.couponCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeCoupon()}
                        aria-label="Remove coupon"
                        className="text-white/40 transition hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex">
                      <input
                        id="coupon"
                        value={couponInput}
                        onChange={(event) => setCouponInput(event.target.value)}
                        placeholder="FLEXX10"
                        className="min-w-0 flex-1 border border-white/15 bg-transparent px-4 py-3 text-sm uppercase outline-none placeholder:text-white/25 focus:border-[var(--brand-red)]"
                      />
                      <button
                        type="submit"
                        disabled={isMutating}
                        className="border border-l-0 border-white/15 px-5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-[var(--brand-red)] hover:text-white disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {cart?.couponMessage && (
                    <p className="mt-2 text-xs text-white/40">{cart.couponMessage}</p>
                  )}
                </form>

                <dl className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm">
                  <Row label="Subtotal" value={formatPrice(totals?.subtotal ?? 0)} />
                  {!!totals?.discount && (
                    <Row
                      label="Discount"
                      value={`-${formatPrice(totals.discount)}`}
                      accent
                    />
                  )}
                  <Row
                    label="Shipping"
                    value={totals?.shipping ? formatPrice(totals.shipping) : "Free"}
                  />
                  <Row label="Estimated tax" value={formatPrice(totals?.tax ?? 0)} />

                  <div className="mt-2 flex justify-between border-t border-white/10 pt-4 text-lg font-bold">
                    <dt>Total</dt>
                    <dd>{formatPrice(totals?.total ?? 0)}</dd>
                  </div>
                </dl>

                {totals && totals.freeShippingRemaining > 0 && (
                  <p className="mt-4 text-xs text-white/40">
                    Add{" "}
                    <span className="font-bold text-[var(--brand-red)]">
                      {formatPrice(totals.freeShippingRemaining)}
                    </span>{" "}
                    more to qualify for free shipping.
                  </p>
                )}

                <Link
                  href="/checkout"
                  className="mt-6 flex items-center justify-center gap-2 bg-[var(--brand-red)] py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--brand-red-dark)]"
                >
                  Proceed to checkout
                  <ArrowRight className="size-4" />
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex justify-between ${accent ? "text-[var(--brand-red)]" : "text-white/60"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
