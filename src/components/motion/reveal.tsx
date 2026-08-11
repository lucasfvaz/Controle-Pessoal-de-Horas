"use client";

import { Children, isValidElement, cloneElement } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

/** Reveal a block when it enters the viewport (fade + slideUp). */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "reveal-item",
        visible && "reveal-item--visible",
        className
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

/** Stagger reveal for sibling children. */
export function RevealStagger({
  children,
  className,
  step = 70,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return (
            <Reveal key={index} delay={index * step}>
              {child}
            </Reveal>
          );
        }
        return (
          <Reveal key={child.key ?? index} delay={index * step}>
            {cloneElement(child)}
          </Reveal>
        );
      })}
    </div>
  );
}
