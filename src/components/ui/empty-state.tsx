"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card } from "./card";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <Card
      variant="muted"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in",
        className
      )}
    >
      <span className="mb-4 rounded-2xl bg-[color:var(--brand-soft)] p-4 text-[color:var(--brand)]">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="font-[family-name:var(--font-display)] text-xl text-[color:var(--text)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[color:var(--text-secondary)]">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
