import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bebas_Neue } from "next/font/google";

import { AppProviders } from "@/components/providers";
import "./globals.css";

const displayFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "FLEXX | Fuel Your Potential",
    template: "%s | FLEXX",
  },
  description:
    "Premium protein supplementation. Whey tubs, protein bars, refill packs and shakers, shipped free over $50.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={displayFont.variable} suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
