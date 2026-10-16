import type { ReactNode } from "react";

type SectionWidth = "narrow" | "default" | "wide" | "full";

type SectionWrapperProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  width?: SectionWidth;
};

const widthClasses: Record<SectionWidth, string> = {
  narrow: "max-w-6xl",
  default: "max-w-7xl",
  wide: "max-w-[1440px]",
  full: "max-w-none",
};

export function SectionWrapper({
  id,
  children,
  className = "",
  width = "default",
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`bg-[var(--brand-black)] px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-10 lg:py-28 ${className}`}
    >
      <div className={`mx-auto w-full ${widthClasses[width]}`}>
        {children}
      </div>
    </section>
  );
}