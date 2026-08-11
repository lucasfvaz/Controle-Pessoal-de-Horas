import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
}) {
  const tones = {
    neutral: "text-slate-900",
    positive: "text-emerald-700",
    negative: "text-rose-700",
    accent: "text-teal-800",
  };
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", tones[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-emerald-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AlertBanner({
  type,
  message,
}: {
  type: "info" | "warning" | "success" | "danger";
  message: string;
}) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[type])}>
      {message}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-emerald-800 text-white hover:bg-emerald-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-rose-700 text-white hover:bg-rose-600",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <input
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-700/30 focus:ring-2",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <select
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-700/30 focus:ring-2",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <textarea
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-700/30 focus:ring-2",
          className
        )}
        {...props}
      />
    </label>
  );
}
