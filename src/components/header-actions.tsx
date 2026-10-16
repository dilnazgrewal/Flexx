"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Package, ShoppingCart, UserRound } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";

export function HeaderActions() {
  const { itemCount, openDrawer } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isMenuOpen]);

  return (
    <div className="flex items-start gap-5">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label="Account"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex size-8 items-center justify-center rounded-full p-0 transition hover:scale-110 hover:bg-[var(--brand-red)] hover:text-white sm:size-9"
        >
          <UserRound className="size-4 sm:size-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-11 w-56 border border-white/10 bg-[#0d0d0d] py-2 text-left shadow-2xl">
            {user ? (
              <>
                <div className="border-b border-white/10 px-4 pb-3 pt-1">
                  <p className="truncate text-sm font-bold text-white">{user.fullName}</p>
                  <p className="truncate text-xs text-white/40">{user.email}</p>
                </div>
                <MenuLink href="/account" onSelect={() => setIsMenuOpen(false)}>
                  <UserRound className="size-4" /> My account
                </MenuLink>
                <MenuLink href="/orders" onSelect={() => setIsMenuOpen(false)}>
                  <Package className="size-4" /> My orders
                </MenuLink>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-[var(--brand-red)]"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <MenuLink href="/login" onSelect={() => setIsMenuOpen(false)}>
                  Sign in
                </MenuLink>
                <MenuLink href="/register" onSelect={() => setIsMenuOpen(false)}>
                  Create account
                </MenuLink>
                <MenuLink href="/track-order" onSelect={() => setIsMenuOpen(false)}>
                  Track an order
                </MenuLink>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openDrawer}
        aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        className="relative flex size-8 items-center justify-center rounded-full p-0 transition hover:scale-110 hover:bg-[var(--brand-red)] hover:text-white sm:size-9"
      >
        <ShoppingCart className="size-4 sm:size-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--brand-red)] px-1 text-[10px] font-bold leading-none text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </div>
  );
}

function MenuLink({
  href,
  children,
  onSelect,
}: {
  href: string;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  );
}
