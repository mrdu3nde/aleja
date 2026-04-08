import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  bg?: "white" | "champagne" | "mushroom";
  id?: string;
};

const bgColors = {
  white: "bg-warm-white",
  champagne: "bg-champagne-light",
  mushroom: "bg-mushroom-light/40",
};

export function Section({
  children,
  className = "",
  bg = "white",
  id,
}: SectionProps) {
  return (
    <section id={id} className={`py-16 md:py-24 ${bgColors[bg]} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
