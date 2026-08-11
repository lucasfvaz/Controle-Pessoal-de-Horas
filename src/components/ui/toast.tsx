"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  leaving?: boolean;
};

type ToastContextValue = {
  toast: (input: Omit<ToastItem, "id" | "leaving">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastVariant, string> = {
  success:
    "border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success)]",
  error:
    "border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] text-[color:var(--status-danger)]",
  warning:
    "border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] text-[color:var(--status-warning)]",
  info: "border-[color:var(--status-info-border)] bg-[color:var(--status-info-bg)] text-[color:var(--status-info)]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 180);
  }, []);

  const toast = useCallback(
    (input: Omit<ToastItem, "id" | "leaving">) => {
      const id = crypto.randomUUID();
      const duration = input.duration ?? 4000;
      setItems((prev) => [...prev, { ...input, id }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
        {items.map((item) => {
          const Icon = icons[item.variant];
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow)] backdrop-blur-sm transition-colors",
                styles[item.variant],
                item.leaving
                  ? "animate-slide-out-right"
                  : "animate-toast-bounce"
              )}
              role="status"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                {item.title ? (
                  <p className="font-semibold">{item.title}</p>
                ) : null}
                <p className="leading-relaxed opacity-90">{item.message}</p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 opacity-70 transition hover:opacity-100"
                onClick={() => dismiss(item.id)}
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
