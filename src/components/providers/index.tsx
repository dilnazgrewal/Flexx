"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { SalesDeskWidget } from "@/components/sales-desk-widget";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <CartDrawer />
          <SalesDeskWidget />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
