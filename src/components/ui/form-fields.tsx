"use client";

import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldExtra = {
  label?: string;
  error?: string;
  success?: boolean;
};

export function Input({
  label,
  className,
  error,
  success,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & FieldExtra) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)] transition-colors">
          {label}
        </span>
      ) : null}
      <div className="relative">
        <input
          className={cn(
            "w-full rounded-xl border bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none transition-colors duration-200 placeholder:text-[color:var(--text-muted)] focus:ring-2 focus:ring-[color:var(--ring)]",
            error
              ? "border-[color:var(--status-danger)]"
              : success
                ? "border-[color:var(--status-success)]"
                : "border-[color:var(--border)]",
            (error || success) && "pr-10",
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error ? (
          <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--status-danger)]" />
        ) : success ? (
          <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--status-success)]" />
        ) : null}
      </div>
      {error ? (
        <span className="text-xs text-[color:var(--status-danger)]">{error}</span>
      ) : null}
    </label>
  );
}

export function Select({
  label,
  children,
  className,
  error,
  success,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & FieldExtra) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)] transition-colors">
          {label}
        </span>
      ) : null}
      <div className="relative">
        <select
          className={cn(
            "w-full rounded-xl border bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--ring)]",
            error
              ? "border-[color:var(--status-danger)]"
              : success
                ? "border-[color:var(--status-success)]"
                : "border-[color:var(--border)]",
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
      </div>
      {error ? (
        <span className="text-xs text-[color:var(--status-danger)]">{error}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  className,
  error,
  success,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtra) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)] transition-colors">
          {label}
        </span>
      ) : null}
      <textarea
        className={cn(
          "w-full rounded-xl border bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none transition-colors duration-200 placeholder:text-[color:var(--text-muted)] focus:ring-2 focus:ring-[color:var(--ring)]",
          error
            ? "border-[color:var(--status-danger)]"
            : success
              ? "border-[color:var(--status-success)]"
              : "border-[color:var(--border)]",
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <span className="text-xs text-[color:var(--status-danger)]">{error}</span>
      ) : null}
    </label>
  );
}
