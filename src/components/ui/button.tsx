"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  loading?: boolean;
}) {
  const variants = {
    primary:
      "bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand-hover)]",
    secondary:
      "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-muted)]",
    danger:
      "bg-[color:var(--status-danger)] text-white hover:opacity-90",
    ghost:
      "text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-muted)]",
    outline:
      "border border-[color:var(--brand)] bg-transparent text-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : null}
      {children}
    </button>
  );
}
