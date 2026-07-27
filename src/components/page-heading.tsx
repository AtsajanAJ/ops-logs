import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeadingProps {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeading({
  title,
  description,
  actions,
  className,
}: PageHeadingProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

interface SectionHeadingProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  meta,
  className,
}: SectionHeadingProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
        )}
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
    </div>
  );
}
