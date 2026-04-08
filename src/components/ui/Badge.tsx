import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full bg-champagne px-3 py-1 text-sm font-medium text-cafe ${className}`}
    >
      {children}
    </span>
  );
}
