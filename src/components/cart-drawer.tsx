"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateItem, removeItem, isMutating } = useCart();

  const items = cart?.items ?? [];
  const totals = cart?.totals;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />

          <motion.aside
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[95] flex w-[min(26rem,100vw)] flex-col border-l border-white/10 bg-[#0a0a0a]"
            aria-label="Shopping bag"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
                  Your bag
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {totals?.itemCount ?? 0} item{(totals?.itemCount ?? 0) === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close bag"
                className="flex size-9 items-center justify-center border border-white/10 text-white/60 transition hover:border-[var(--brand-red)] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <ShoppingBag className="size-10 text-white/20" />
                <p className="text-lg font-bold uppercase text-white/80">Your bag is empty</p>
                <p className="max-w-xs text-sm text-white/40">
                  Add a tub, a bar or a shaker and it will show up right here.
                </p>
                <Link
                  href="/products"
                  onClick={closeDrawer}
                  className="mt-2 bg-[var(--brand-red)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--brand-red-dark)]"
                >
                  Shop products
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {totals && totals.freeShippingRemaining > 0 && (
                    <p className="mb-5 border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/60">
                      Spend{" "}
                      <span className="font-bold text-[var(--brand-red)]">
                        {formatPrice(totals.freeShippingRemaining)}
                      </span>{" "}
                      more for free shipping.
                    </p>
                  )}

                  <ul className="flex flex-col gap-5">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-4">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeDrawer}
                          className="relative size-20 shrink-0 overflow-hidden bg-[#141414]"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-contain"
                          />
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeDrawer}
                            className="truncate text-sm font-bold uppercase hover:text-[var(--brand-red)]"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-white/40">{item.flavor}</p>

                          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                            <div className="flex items-center border border-white/15">
                              <button
                                type="button"
                                disabled={isMutating}
                                onClick={() => void updateItem(item.id, item.quantity - 1)}
                                aria-label={`Decrease ${item.name} quantity`}
                                className="flex size-7 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isMutating || item.quantity >= item.stock}
                                onClick={() => void updateItem(item.id, item.quantity + 1)}
                                aria-label={`Increase ${item.name} quantity`}
                                className="flex size-7 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>

                            <span className="text-sm font-bold">
                              {formatPrice(item.lineTotal)}
                            </span>

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
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="border-t border-white/10 px-6 py-5">
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-white/60">
                      <dt>Subtotal</dt>
                      <dd>{formatPrice(totals?.subtotal ?? 0)}</dd>
                    </div>
                    {!!totals?.discount && (
                      <div className="flex justify-between text-[var(--brand-red)]">
                        <dt>Discount</dt>
                        <dd>-{formatPrice(totals.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-white/60">
                      <dt>Shipping</dt>
                      <dd>
                        {totals?.shipping ? formatPrice(totals.shipping) : "Free"}
                      </dd>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <dt>Tax</dt>
                      <dd>{formatPrice(totals?.tax ?? 0)}</dd>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-base font-bold">
                      <dt>Total</dt>
                      <dd>{formatPrice(totals?.total ?? 0)}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      href="/checkout"
                      onClick={closeDrawer}
                      className="bg-[var(--brand-red)] py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--brand-red-dark)]"
                    >
                      Checkout
                    </Link>
                    <Link
                      href="/cart"
                      onClick={closeDrawer}
                      className="border border-white/15 py-3 text-center text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                      View bag
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
