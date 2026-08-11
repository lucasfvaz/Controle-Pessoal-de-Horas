"use client";

import { cn } from "@/lib/utils";

function toneForPercent(value: number) {
  if (value >= 80) return "bg-[color:var(--status-success)]";
  if (value >= 50) return "bg-[color:var(--status-warning)]";
  return "bg-[color:var(--status-danger)]";
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className={cn("w-full", className)}>
      {showLabel ? (
        <div className="mb-1 flex justify-between text-xs text-[color:var(--text-muted)]">
          <span>Progresso</span>
          <span>{pct}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            toneForPercent(pct)
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  max = 100,
  size = 88,
  strokeWidth = 8,
  className,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct >= 80
      ? "var(--status-success)"
      : pct >= 50
        ? "var(--status-warning)"
        : "var(--status-danger)";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold tabular-nums text-[color:var(--text)]">
          {Math.round(pct)}%
        </span>
        {label ? (
          <span className="text-[10px] text-[color:var(--text-muted)]">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
