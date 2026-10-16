"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/providers/auth-provider";

const links = [
  { label: "All Products", href: "/products" },
  { label: "Categories", href: "/#categories" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Track Order", href: "/track-order" },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-80 flex-col">
        <SheetHeader>
          <SheetTitle className="text-left text-2xl font-black tracking-[-0.08em]">
            FLEXX
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-1 border-t border-white/10 pt-6">
          {user ? (
            <>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                My Account
              </Link>
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                My Orders
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--brand-red)] transition-colors hover:bg-muted"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-sm font-black tracking-[-0.05em]">FLEXX</p>
          <p className="mt-1 text-xs text-muted-foreground">Fuel your potential.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
