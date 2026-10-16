import Image from "next/image";
import Link from "next/link";

import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  confirmed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  processing: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  shipped: "border-indigo-400/40 bg-indigo-400/10 text-indigo-300",
  delivered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-red-500/40 bg-red-500/10 text-red-300",
};

const timeline: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
        This order was cancelled. Any stock has been returned to the store.
      </p>
    );
  }

  const activeIndex = timeline.indexOf(status);

  return (
    <ol className="flex items-center">
      {timeline.map((step, index) => {
        const reached = index <= activeIndex;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold ${
                  reached
                    ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
                    : "border-white/15 text-white/30"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  reached ? "text-white" : "text-white/30"
                }`}
              >
                {step}
              </span>
            </div>

            {index < timeline.length - 1 && (
              <span
                className={`mx-2 mb-6 h-px flex-1 ${
                  index < activeIndex ? "bg-[var(--brand-red)]" : "bg-white/15"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <section>
        <h2 className="text-lg font-bold uppercase">Items</h2>

        <ul className="mt-5 flex flex-col divide-y divide-white/10 border-y border-white/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-5">
              <Link
                href={`/products/${item.productSlug}`}
                className="relative size-20 shrink-0 overflow-hidden bg-[#111111]"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="block truncate text-sm font-bold uppercase hover:text-[var(--brand-red)]"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-white/40">{item.flavor}</p>
                <p className="mt-1 text-xs text-white/50">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>

              <span className="text-sm font-bold">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">
              Shipping to
            </h3>
            <address className="mt-3 text-sm not-italic leading-6 text-white/70">
              {order.fullName}
              <br />
              {order.line1}
              {order.line2 && (
                <>
                  <br />
                  {order.line2}
                </>
              )}
              <br />
              {order.city}, {order.state} {order.postalCode}
              <br />
              {order.country}
              <br />
              <span className="text-white/40">{order.phone}</span>
            </address>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">
              Payment
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {order.paymentMethod === "cod"
                ? "Cash on delivery"
                : order.paymentMethod.toUpperCase()}
              <br />
              <span className="capitalize text-white/40">
                Status: {order.paymentStatus}
              </span>
              <br />
              <span className="text-white/40">{order.email}</span>
            </p>

            {order.notes && (
              <p className="mt-4 border-l-2 border-white/15 pl-3 text-sm text-white/50">
                “{order.notes}”
              </p>
            )}
          </div>
        </div>
      </section>

      <aside className="h-fit border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-lg font-bold uppercase">Summary</h2>

        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-white/60">
            <dt>Placed</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div className="flex justify-between text-white/60">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {!!order.discount && (
            <div className="flex justify-between text-[var(--brand-red)]">
              <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
              <dd>-{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-white/60">
            <dt>Shipping</dt>
            <dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between text-white/60">
            <dt>Tax</dt>
            <dd>{formatPrice(order.tax)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-4 text-lg font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
