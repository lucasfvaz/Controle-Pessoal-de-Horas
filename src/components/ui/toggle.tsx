"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          checked
            ? "bg-[color:var(--brand)]"
            : "bg-[color:var(--border-strong)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
      {label ? (
        <span className="text-sm text-[color:var(--text-secondary)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
