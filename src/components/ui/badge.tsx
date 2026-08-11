"use client";

import { cn } from "@/lib/utils";

const colors = {
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  amber:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  slate:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  violet:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
};

export function Badge({
  children,
  color = "emerald",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  color?: keyof typeof colors;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
