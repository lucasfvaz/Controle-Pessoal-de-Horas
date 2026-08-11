"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  disabled,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  loading?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<
    Array<{ id: number; x: number; y: number; size: number }>
  >([]);
  const [pulse, setPulse] = useState(false);

  const variants = {
    primary:
      "bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand-hover)]",
    secondary:
      "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-muted)]",
    danger: "bg-[color:var(--status-danger)] text-white hover:opacity-90",
    ghost:
      "text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-muted)]",
    outline:
      "border border-[color:var(--brand)] bg-transparent text-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]",
  };

  function spawnRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y, size }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 450);
  }

  return (
    <button
      ref={ref}
      className={cn(
        "btn-interactive inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
        pulse && "animate-action-pulse",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
      onClick={(e) => {
        if (variant === "primary" || variant === "danger") {
          spawnRipple(e);
          setPulse(true);
          window.setTimeout(() => setPulse(false), 280);
        }
        onClick?.(e);
      }}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="btn-ripple-ink"
          style={{
            width: r.size,
            height: r.size,
            left: r.x,
            top: r.y,
          }}
        />
      ))}
      {loading ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : null}
      {children}
    </button>
  );
}
