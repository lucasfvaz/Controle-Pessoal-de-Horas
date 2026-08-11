"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 280,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function show() {
    timer = setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    if (timer) clearTimeout(timer);
    setOpen(false);
  }

  const positions = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
  };

  const arrows = {
    top: "left-1/2 top-full -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[color:var(--text)]",
    bottom:
      "left-1/2 bottom-full -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[color:var(--text)]",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[color:var(--text)]",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[color:var(--text)]",
  };

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[color:var(--text)] px-2.5 py-1.5 text-xs text-[color:var(--text-inverse)] shadow-[var(--shadow)] animate-fade-in",
            positions[side]
          )}
        >
          {content}
          <span
            className={cn("absolute h-0 w-0 border-4", arrows[side])}
            aria-hidden
          />
        </span>
      ) : null}
    </span>
  );
}
