import Link from "next/link";
import Image from "next/image";

import { HeaderActions } from "@/components/header-actions";
import { MobileSidebar } from "@/components/mobile-sidebar";

const navigationLinks = [
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/#categories" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Track Order", href: "/track-order" },
];

type SiteHeaderProps = {
  /**
   * "overlay" floats transparently over the hero (home page);
   * "solid" is the opaque bar used by every other route.
   */
  variant?: "overlay" | "solid";
};

export function SiteHeader({ variant = "overlay" }: SiteHeaderProps) {
  const isOverlay = variant === "overlay";

  return (
    <header
      className={
        isOverlay
          ? "pointer-events-none absolute inset-x-0 top-0 z-50 bg-transparent"
          : "sticky top-0 z-50 border-b border-white/10 bg-[var(--brand-black)]/95 backdrop-blur"
      }
    >
      <div
        className={`mx-auto flex max-w-[1600px] items-center justify-between px-6 lg:px-10 ${
          isOverlay ? "py-6 lg:py-8" : "py-4"
        }`}
      >
        <Link
          href="/"
          className="pointer-events-auto shrink-0"
          aria-label="Flexx home"
        >
          <Image
            src="/images/logoo-flexx-dark.svg"
            alt="Flexx"
            width={80}
            height={24}
            priority
            className="h-auto w-16"
          />
        </Link>

        <nav
          className="pointer-events-auto hidden text-[#928886] lg:flex lg:gap-8"
          aria-label="Primary navigation"
        >
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-xs font-extrabold uppercase tracking-[0.02em] transition-colors duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--brand-red)] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="pointer-events-auto flex items-center gap-5 font-bold text-[#928886]">
          <HeaderActions />
          <MobileSidebar />
        </div>
      </div>
    </header>
  );
}
