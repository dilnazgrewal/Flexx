"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Star } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { createReview } from "@/lib/api";

export function ReviewForm({ slug }: { slug: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    try {
      await createReview(slug, {
        rating,
        title: title.trim(),
        body: body.trim(),
        authorName: user ? undefined : authorName.trim(),
      });
      toast("Thanks - your review is live.", "success");
      setTitle("");
      setBody("");
      setAuthorName("");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not post review.", "error");
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-[var(--brand-red)] hover:text-white"
      >
        Write a review
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/10 bg-white/[0.02] p-6"
    >
      <fieldset className="flex items-center gap-2" disabled={isPending}>
        <legend className="sr-only">Your rating</legend>
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(value)}
              className="transition hover:scale-110"
            >
              <Star
                className={`size-6 ${
                  value <= (hovered || rating)
                    ? "text-[var(--brand-red)]"
                    : "text-white/20"
                }`}
                fill="currentColor"
              />
            </button>
          );
        })}
      </fieldset>

      {!user && (
        <input
          type="text"
          required
          minLength={2}
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          placeholder="Your name"
          className="mt-5 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--brand-red)]"
        />
      )}

      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Headline (optional)"
        className="mt-3 w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--brand-red)]"
      />

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="How did you find the flavour, texture and mixability?"
        className="mt-3 w-full resize-y border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--brand-red)]"
      />

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[var(--brand-red)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--brand-red-dark)] disabled:opacity-50"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Post review
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/50 transition hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
