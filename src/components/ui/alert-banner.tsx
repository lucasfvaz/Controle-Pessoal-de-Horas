"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  danger: XCircle,
};

const styles = {
  info: "border-[color:var(--status-info-border)] bg-[color:var(--status-info-bg)] text-[color:var(--status-info)]",
  warning:
    "border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] text-[color:var(--status-warning)]",
  success:
    "border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success)]",
  danger:
    "border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] text-[color:var(--status-danger)]",
};

export function AlertBanner({
  type,
  message,
  dismissible = false,
  onDismiss,
  className,
}: {
  type: "info" | "warning" | "success" | "danger";
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    setVisible(true);
    setLeaving(false);
  }, [message, type]);

  if (!visible) return null;

  function dismiss() {
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 180);
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200",
        styles[type],
        leaving ? "animate-slide-out-right opacity-0" : "animate-slide-down",
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 leading-relaxed">{message}</p>
      {dismissible ? (
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 opacity-70 transition hover:opacity-100"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
