"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
  icon?: LucideIcon;
  className?: string;
}) {
  const tones = {
    neutral: "text-[color:var(--text)]",
    positive: "text-[color:var(--status-success)]",
    negative: "text-[color:var(--status-danger)]",
    accent: "text-[color:var(--brand)]",
  };

  return (
    <Card className={cn("animate-slide-up", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)] transition-colors">
          {label}
        </p>
        {Icon ? (
          <span className="rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)] transition-colors">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p
        key={value}
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums animate-fade-in transition-colors",
          tones[tone]
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[color:var(--text-muted)] transition-colors">
          {hint}
        </p>
      ) : null}
    </Card>
  );
}
