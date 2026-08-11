"use client";

import { cn } from "@/lib/utils";

/** Page-level enter: fadeIn + subtle slideUp (300ms ease-out). */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-transition", className)}>{children}</div>
  );
}
