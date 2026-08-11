"use client";

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-slide-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[color:var(--brand)] transition-colors">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-secondary)] transition-colors">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
