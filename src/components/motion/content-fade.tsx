"use client";

import { cn } from "@/lib/utils";

/** Crossfade when real content replaces a skeleton. */
export function ContentFade({
  children,
  className,
  show = true,
}: {
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}) {
  return (
    <div
      className={cn(
        "content-fade",
        show ? "content-fade--in" : "content-fade--out",
        className
      )}
    >
      {children}
    </div>
  );
}
