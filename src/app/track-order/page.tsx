"use client";

import { useState } from "react";
import { Loader2, PackageSearch } from "lucide-react";

import {
  OrderDetails,
  OrderTimeline,
  StatusBadge,
} from "@/components/order-summary-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { trackOrder } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      setOrder(await trackOrder({ orderNumber: orderNumber.trim(), email: email.trim() }));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Could not find that order.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-[70vh] bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1100px]">
          <PackageSearch className="size-9 text-[var(--brand-red)]" />
          <h1 className="mt-5 text-4xl font-bold uppercase leading-none text-[#928886] sm:text-5xl">
            Track your order
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/50">
            Enter the order number from your confirmation email along with the email
            address you ordered with.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label
                htmlFor="orderNumber"
                className="text-xs font-bold uppercase tracking-widest text-white/40"
              >
                Order number
              </label>
              <input
                id="orderNumber"
                required
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="FLX-260101-A1B2C3"
                className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm uppercase outline-none placeholder:text-white/25 focus:border-[var(--brand-red)]"
              />
            </div>

            <div>
              <label
                htmlFor="trackEmail"
                className="text-xs font-bold uppercase tracking-widest text-white/40"
              >
                Email
              </label>
              <input
                id="trackEmail"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-[var(--brand-red)]"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 self-end bg-[var(--brand-red)] px-8 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)] disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Track
            </button>
          </form>

          {error && (
            <p className="mt-6 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {order && (
            <div className="mt-14 border-t border-white/10 pt-10">
              <div className="flex flex-wrap items-center gap-4">
                <span className="border border-white/15 px-4 py-2 font-mono text-sm tracking-wider">
                  {order.orderNumber}
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-10">
                <OrderTimeline status={order.status} />
              </div>

              <div className="mt-14">
                <OrderDetails order={order} />
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
