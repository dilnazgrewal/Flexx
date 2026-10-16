"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function LoginForm() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      const signedIn = await login(email.trim(), password);
      toast(`Welcome back, ${signedIn.fullName.split(" ")[0]}.`, "success");
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-4xl font-bold uppercase leading-none text-[#928886]">
        Sign in
      </h1>
      <p className="mt-4 text-sm text-white/50">
        Access your orders, saved addresses and a cart that follows you between
        devices.
      </p>

      <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-5">
        <div>
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-widest text-white/40"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--brand-red)]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-xs font-bold uppercase tracking-widest text-white/40"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--brand-red)]"
          />
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
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-white/40">
        No account yet?{" "}
        <Link href="/register" className="text-[var(--brand-red)] hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-8 border border-white/10 bg-white/[0.02] px-4 py-3 text-xs leading-5 text-white/40">
        <p className="font-bold uppercase tracking-widest text-white/50">Demo login</p>
        <p className="mt-1">demo@flexx.com · DemoUser123!</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader variant="solid" />
      <main className="flex min-h-[70vh] items-center bg-[var(--brand-black)] px-4 py-16 text-white sm:px-6">
        <Suspense fallback={<div className="h-80" />}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
