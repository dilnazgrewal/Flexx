"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";

type AddToCartButtonProps = {
  slug: string;
  name: string;
  stock: number;
  withQuantity?: boolean;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  slug,
  name,
  stock,
  withQuantity = false,
  className = "",
  label = "Add to bag",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);

  const soldOut = stock <= 0;

  async function handleAdd() {
    if (soldOut || isPending) return;
    setIsPending(true);
    try {
      await addItem(slug, quantity, name);
      setQuantity(1);
    } catch {
      /* the cart provider already surfaced the error as a toast */
    } finally {
      setIsPending(false);
    }
  }

  const button = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={soldOut || isPending}
      className={`flex w-full items-center justify-center gap-2 bg-[var(--brand-red)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--brand-red-dark)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 ${className}`}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      {soldOut ? "Sold out" : label}
    </button>
  );

  if (!withQuantity) return button;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
      <div className="flex items-center justify-between border border-white/15 sm:w-36">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          className="flex size-12 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <Minus className="size-4" />
        </button>

        <span className="text-sm font-bold" aria-live="polite">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
          disabled={quantity >= stock}
          aria-label="Increase quantity"
          className="flex size-12 items-center justify-center text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex-1">{button}</div>
    </div>
  );
}
