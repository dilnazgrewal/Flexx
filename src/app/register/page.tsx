"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      const user = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      toast(`Account created. Welcome, ${user.fullName.split(" ")[0]}.`, "success");
      router.replace("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setIsPending(false);
    }
  }

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="flex min-h-[70vh] items-center bg-[var(--brand-black)] px-4 py-16 text-white sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-4xl font-bold uppercase leading-none text-[#928886]">
            Create account
          </h1>
          <p className="mt-4 text-sm text-white/50">
            One account for orders, tracking and a cart that persists.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-5">
            <Field
              id="fullName"
              label="Full name"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(value) => setForm({ ...form, fullName: value })}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(value) => setForm({ ...form, email: value })}
            />
            <Field
              id="phone"
              label="Phone (optional)"
              autoComplete="tel"
              value={form.phone}
              onChange={(value) => setForm({ ...form, phone: value })}
            />
            <div>
              <Field
                id="password"
                label="Password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(value) => setForm({ ...form, password: value })}
              />
              <p className="mt-2 text-xs text-white/35">At least 8 characters.</p>
            </div>

            {error && (
              <p className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 bg-[var(--brand-red)] py-4 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--brand-red-dark)] disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-6 text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--brand-red)] hover:underline">
              Sign in
            </Link>
          </p>
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
  minLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-widest text-white/40"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--brand-red)]"
      />
    </div>
  );
}
