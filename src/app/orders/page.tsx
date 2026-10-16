"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { StatusBadge } from "@/components/order-summary-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cancelOrder, getMyOrders } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login?next=/orders");
      return;
    }
    load();
  }, [user, isAuthLoading, router, load]);

  async function handleCancel(orderNumber: string) {
    setCancellingId(orderNumber);
    try {
      await cancelOrder(orderNumber);
      toast("Order cancelled and stock returned.", "success");
      load();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not cancel that order.",
        "error",
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-[70vh] bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1100px]">
          <h1 className="text-4xl font-bold uppercase leading-none text-[#928886] sm:text-5xl">
            My orders
          </h1>

          {!orders ? (
            <div className="flex items-center gap-3 py-24 text-white/40">
              <Loader2 className="size-5 animate-spin" />
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-24 text-center">
              <Package className="size-12 text-white/15" />
              <p className="text-2xl font-bold uppercase text-white/70">
                No orders yet
              </p>
              <p className="max-w-sm text-sm text-white/40">
                When you place an order it will appear here with its status and full
                receipt.
              </p>
              <Link
                href="/products"
                className="mt-2 bg-[var(--brand-red)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="mt-10 flex flex-col gap-6">
              {orders.map((order) => {
                const canCancel = !["shipped", "delivered", "cancelled"].includes(
                  order.status,
                );
                return (
                  <li
                    key={order.id}
                    className="border border-white/10 bg-white/[0.02] p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/order/${order.orderNumber}`}
                          className="font-mono text-sm tracking-wider hover:text-[var(--brand-red)]"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-1 text-xs text-white/40">
                          {formatDateTime(order.createdAt)} · {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <StatusBadge status={order.status} />
                        <span className="text-lg font-bold">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="relative size-16 overflow-hidden bg-[#111111]"
                          title={`${item.name} × ${item.quantity}`}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-contain"
                          />
                          <span className="absolute bottom-0 right-0 bg-black/80 px-1.5 text-[10px] font-bold">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/order/${order.orderNumber}`}
                        className="border border-white/15 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:text-white"
                      >
                        View details
                      </Link>

                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancellingId === order.orderNumber}
                          onClick={() => void handleCancel(order.orderNumber)}
                          className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white/40 transition hover:text-[var(--brand-red)] disabled:opacity-50"
                        >
                          {cancellingId === order.orderNumber
                            ? "Cancelling..."
                            : "Cancel order"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
