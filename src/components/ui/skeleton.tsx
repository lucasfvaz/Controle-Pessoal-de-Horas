"use client";

import { cn } from "@/lib/utils";

export function Skeleton({
  shape = "line",
  className,
}: {
  shape?: "line" | "circle" | "rect" | "chart";
  className?: string;
}) {
  const shapes = {
    line: "h-3 w-full rounded-md",
    circle: "h-10 w-10 rounded-full",
    rect: "h-24 w-full rounded-xl",
    chart: "h-64 w-full rounded-2xl",
  };

  return (
    <div
      className={cn(
        "animate-shimmer bg-[color:var(--surface-muted)]",
        shapes[shape],
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
      <Skeleton shape="line" className="w-1/3" />
      <Skeleton shape="line" className="h-8 w-1/2" />
      <Skeleton shape="line" className="w-1/4" />
    </div>
  );
}
