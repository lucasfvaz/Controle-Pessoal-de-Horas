"use client";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  variant = "default",
  style,
  interactive = true,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "muted";
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  const variants = {
    default:
      "border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow)]",
    glass:
      "border-[color:var(--border)] bg-[color:var(--surface-glass)] shadow-[var(--shadow)] backdrop-blur-md",
    muted:
      "border-[color:var(--border)] bg-[color:var(--surface-muted)] shadow-none",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-colors duration-200",
        interactive && "card-interactive",
        variants[variant],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
