import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm ${hover ? "transition-shadow duration-300 hover:shadow-md" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
