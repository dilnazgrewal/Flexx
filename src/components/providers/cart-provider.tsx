"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { AUTH_CHANGED_EVENT } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

type CartContextValue = {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  isMutating: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (slug: string, quantity?: number, name?: string) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();

  /** Persist the server-issued cart token so a guest keeps their basket. */
  const commit = useCallback((next: Cart) => {
    api.writeStorage(api.CART_STORAGE_KEY, next.token);
    setCart(next);
  }, []);

  const refresh = useCallback(
    async (isStale: () => boolean = () => false) => {
      try {
        const next = await api.fetchCart();
        if (isStale()) return;
        commit(next);
      } catch (error) {
        if (isStale()) return;
        if (error instanceof ApiError && error.status === 0) {
          // Backend offline - leave the cart empty instead of crashing the page.
          setCart(null);
        }
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    },
    [commit],
  );

  // Load the cart on mount, and again whenever the signed-in identity changes
  // (the server hands back a different cart for a user than for a guest).
  useEffect(() => {
    let cancelled = false;
    const isStale = () => cancelled;

    // The state updates happen after the await, inside the promise, not
    // synchronously in this effect body - the lint rule cannot see through
    // the async boundary, and a stale-guard already covers unmounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(isStale);

    const handler = () => void refresh(isStale);
    window.addEventListener(AUTH_CHANGED_EVENT, handler);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, handler);
    };
  }, [refresh]);

  const run = useCallback(
    async (action: () => Promise<Cart>, successMessage?: string) => {
      setIsMutating(true);
      try {
        commit(await action());
        if (successMessage) toast(successMessage, "success");
      } catch (error) {
        toast(
          error instanceof Error ? error.message : "Something went wrong.",
          "error",
        );
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [commit, toast],
  );

  const addItem = useCallback(
    async (slug: string, quantity = 1, name?: string) => {
      await run(
        () => api.addCartItem(slug, quantity),
        `${name ?? "Item"} added to your bag.`,
      );
      setIsDrawerOpen(true);
    },
    [run],
  );

  const updateItem = useCallback(
    (itemId: number, quantity: number) => run(() => api.updateCartItem(itemId, quantity)),
    [run],
  );

  const removeItem = useCallback(
    (itemId: number) => run(() => api.removeCartItem(itemId), "Removed from your bag."),
    [run],
  );

  const clear = useCallback(
    () => run(() => api.clearCart(), "Bag emptied."),
    [run],
  );

  const applyCoupon = useCallback(
    (code: string) => run(() => api.applyCoupon(code), `Coupon ${code.toUpperCase()} applied.`),
    [run],
  );

  const removeCoupon = useCallback(
    () => run(() => api.removeCoupon(), "Coupon removed."),
    [run],
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount: cart?.totals.itemCount ?? 0,
      isLoading,
      isMutating,
      isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      addItem,
      updateItem,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      refresh: () => refresh(),
    }),
    [
      cart,
      isLoading,
      isMutating,
      isDrawerOpen,
      addItem,
      updateItem,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      refresh,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
