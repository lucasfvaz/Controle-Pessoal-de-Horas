"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export function Tabs({
  items,
  defaultTab,
  className,
  onChange,
}: {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
  onChange?: (id: string) => void;
}) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(
      `[data-tab-id="${active}"]`
    );
    if (!btn) return;
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [active, items]);

  function select(id: string) {
    setActive(id);
    onChange?.(id);
  }

  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={listRef}
        role="tablist"
        className="relative flex gap-1 overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1"
      >
        <span
          className="absolute top-1 bottom-1 rounded-lg bg-[color:var(--surface)] shadow-sm transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-tab-id={item.id}
            aria-selected={active === item.id}
            className={cn(
              "relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active === item.id
                ? "text-[color:var(--text)]"
                : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
            )}
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-4 animate-fade-in">
        {current?.content}
      </div>
    </div>
  );
}
