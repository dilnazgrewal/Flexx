"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Loader2, Lock, Smartphone, Truck } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { checkout } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const paymentMethods = [
  {
    value: "card",
    label: "Card",
    description: "Visa, Mastercard, Amex",
    icon: CreditCard,
  },
  { value: "upi", label: "UPI", description: "Pay by UPI ID", icon: Smartphone },
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay the courier",
    icon: Truck,
  },
] as const;

type PaymentMethod = (typeof paymentMethods)[number]["value"];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading, refresh } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Prefill from the signed-in account, once per user, without clobbering
  // anything the customer has already typed.
  const [prefilledFor, setPrefilledFor] = useState<number | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setEmail((current) => current || user.email);
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.fullName,
      phone: current.phone || user.phone || "",
    }));
  }

  const items = cart?.items ?? [];
  const totals = cart?.totals;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0 || isPending) return;

    setIsPending(true);
    try {
      const order = await checkout({
        email: email.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
        saveAddress: Boolean(user) && saveAddress,
        shippingAddress: {
          ...form,
          line2: form.line2.trim() || undefined,
        },
      });
      await refresh();
      toast("Order placed. Check your inbox for the confirmation.", "success");
      router.push(`/order/${order.orderNumber}`);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not place your order.",
        "error",
      );
      setIsPending(false);
    }
  }

  if (!isLoading && items.length === 0) {
    return (
      <>
        <SiteHeader variant="solid" />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-[var(--brand-black)] px-6 text-center text-white">
          <h1 className="text-3xl font-bold uppercase text-white/70">
            Nothing to check out
          </h1>
          <p className="max-w-sm text-sm text-white/40">
            Your bag is empty, so there is nothing to pay for yet.
          </p>
          <Link
            href="/products"
            className="bg-[var(--brand-red)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)]"
          >
            Browse products
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="min-h-screen bg-[var(--brand-black)] px-4 py-12 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-4xl font-bold uppercase leading-none text-[#928886] sm:text-5xl">
            Checkout
          </h1>

          {!user && (
            <p className="mt-4 text-sm text-white/40">
              Checking out as a guest.{" "}
              <Link href="/login" className="text-[var(--brand-red)] hover:underline">
                Sign in
              </Link>{" "}
              to save your details and track orders.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col gap-10">
              <section>
                <h2 className="text-lg font-bold uppercase">Contact</h2>
                <div className="mt-5">
                  <Field
                    id="email"
                    label="Email address"
                    type="email"
                    required
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                  />
                  <p className="mt-2 text-xs text-white/35">
                    Your order confirmation and tracking link go here.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold uppercase">Shipping address</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field
                    id="fullName"
                    label="Full name"
                    required
                    value={form.fullName}
                    onChange={(value) => setForm({ ...form, fullName: value })}
                  />
                  <Field
                    id="phone"
                    label="Phone"
                    required
                    value={form.phone}
                    onChange={(value) => setForm({ ...form, phone: value })}
                  />
                  <Field
                    id="line1"
                    label="Address"
                    required
                    className="sm:col-span-2"
                    value={form.line1}
                    onChange={(value) => setForm({ ...form, line1: value })}
                  />
                  <Field
                    id="line2"
                    label="Apartment, suite (optional)"
                    className="sm:col-span-2"
                    value={form.line2}
                    onChange={(value) => setForm({ ...form, line2: value })}
                  />
                  <Field
                    id="city"
                    label="City"
                    required
                    value={form.city}
                    onChange={(value) => setForm({ ...form, city: value })}
                  />
                  <Field
                    id="state"
                    label="State / Province"
                    required
                    value={form.state}
                    onChange={(value) => setForm({ ...form, state: value })}
                  />
                  <Field
                    id="postalCode"
                    label="Postal code"
                    required
                    value={form.postalCode}
                    onChange={(value) => setForm({ ...form, postalCode: value })}
                  />
                  <Field
                    id="country"
                    label="Country"
                    required
                    value={form.country}
                    onChange={(value) => setForm({ ...form, country: value })}
                  />
                </div>

                {user && (
                  <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-white/50">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                      className="size-4 accent-[var(--brand-red)]"
                    />
                    Save this address to my account
                  </label>
                )}
              </section>

              <section>
                <h2 className="text-lg font-bold uppercase">Payment</h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.value;
                    return (
                      <label
                        key={method.value}
                        className={`flex cursor-pointer flex-col gap-1 border p-4 transition ${
                          active
                            ? "border-[var(--brand-red)] bg-[var(--brand-red)]/10"
                            : "border-white/15 hover:border-white/35"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={active}
                          onChange={() => setPaymentMethod(method.value)}
                          className="sr-only"
                        />
                        <Icon
                          className={`size-5 ${active ? "text-[var(--brand-red)]" : "text-white/40"}`}
                        />
                        <span className="mt-1 text-sm font-bold uppercase">
                          {method.label}
                        </span>
                        <span className="text-xs text-white/40">
                          {method.description}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <p className="mt-4 flex items-center gap-2 text-xs text-white/35">
                  <Lock className="size-3.5" />
                  This is a demo storefront - no real payment is taken and no card
                  details are collected.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold uppercase">Delivery notes</h2>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Leave with a neighbour, gate code, etc."
                  className="mt-4 w-full resize-y border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-[var(--brand-red)]"
                />
              </section>
            </div>

            <aside className="h-fit border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-bold uppercase">Your order</h2>

              <ul className="mt-5 flex flex-col gap-4 border-b border-white/10 pb-5">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden bg-[#111111]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--brand-red)] text-[10px] font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold uppercase">{item.name}</p>
                      <p className="text-xs text-white/40">{item.flavor}</p>
                    </div>
                    <span className="text-sm font-bold">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-5 flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-white/60">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(totals?.subtotal ?? 0)}</dd>
                </div>
                {!!totals?.discount && (
                  <div className="flex justify-between text-[var(--brand-red)]">
                    <dt>Discount {cart?.couponCode ? `(${cart.couponCode})` : ""}</dt>
                    <dd>-{formatPrice(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <dt>Shipping</dt>
                  <dd>{totals?.shipping ? formatPrice(totals.shipping) : "Free"}</dd>
                </div>
                <div className="flex justify-between text-white/60">
                  <dt>Tax</dt>
                  <dd>{formatPrice(totals?.tax ?? 0)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-white/10 pt-4 text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{formatPrice(totals?.total ?? 0)}</dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={isPending || isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-[var(--brand-red)] py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--brand-red-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Placing order..." : `Place order · ${formatPrice(totals?.total ?? 0)}`}
              </button>

              <Link
                href="/cart"
                className="mt-3 block text-center text-xs font-bold uppercase tracking-widest text-white/40 transition hover:text-white"
              >
                Back to bag
              </Link>
            </aside>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-widest text-white/40"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-[var(--brand-red)]"
      />
    </div>
  );
}
