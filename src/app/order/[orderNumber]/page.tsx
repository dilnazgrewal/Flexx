"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  OrderDetails,
  OrderTimeline,
  StatusBadge,
} from "@/components/order-summary-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getOrder } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrder(orderNumber)
      .then(setOrder)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load that order."),
      );
  }, [orderNumber]);

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-[70vh] bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1100px]">
          {error ? (
            <div className="py-24 text-center">
              <h1 className="text-3xl font-bold uppercase text-white/70">
                Order not found
              </h1>
              <p className="mt-3 text-sm text-white/40">{error}</p>
              <Link
                href="/track-order"
                className="mt-8 inline-block bg-[var(--brand-red)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)]"
              >
                Track an order
              </Link>
            </div>
          ) : !order ? (
            <div className="flex items-center gap-3 py-24 text-white/40">
              <Loader2 className="size-5 animate-spin" />
              Loading your order...
            </div>
          ) : (
            <>
              <div className="flex flex-col items-start gap-4 border-b border-white/10 pb-10">
                <CheckCircle2 className="size-10 text-[var(--brand-red)]" />

                <h1 className="text-4xl font-bold uppercase leading-none sm:text-5xl">
                  Thank you, {order.fullName.split(" ")[0]}
                </h1>

                <p className="text-sm text-white/50">
                  Your order is confirmed. We sent the details to{" "}
                  <span className="text-white">{order.email}</span>.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <span className="border border-white/15 px-4 py-2 font-mono text-sm tracking-wider">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <div className="mt-10">
                <OrderTimeline status={order.status} />
              </div>

              <div className="mt-14">
                <OrderDetails order={order} />
              </div>

              <div className="mt-12 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="bg-[var(--brand-red)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)]"
                >
                  Keep shopping
                </Link>
                <Link
                  href="/orders"
                  className="border border-white/15 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  My orders
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
