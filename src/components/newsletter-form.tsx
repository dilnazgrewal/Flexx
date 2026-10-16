"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/api";

export function NewsletterForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      const result = await subscribeNewsletter(email.trim());
      toast(result.message, "success");
      setName("");
      setEmail("");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not subscribe right now.",
        "error",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="newsletter-name" className="sr-only">
        Your name
      </label>
      <input
        id="newsletter-name"
        name="name"
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--brand-red)]"
      />

      <label htmlFor="newsletter-email" className="sr-only">
        Your email
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        placeholder="Your email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--brand-red)]"
      />

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-3xl bg-[var(--brand-red)] font-bold uppercase transition hover:bg-[var(--brand-red-dark)]"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Keep me posted
      </Button>
    </form>
  );
}
