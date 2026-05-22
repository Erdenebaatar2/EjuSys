import type { ComponentType, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "blue" | "teal" | "emerald" | "amber" | "rose" | "violet";

const toneStyles: Record<
  Tone,
  {
    icon: string;
    bar: string;
    subtle: string;
  }
> = {
  blue: {
    icon: "bg-primary/10 text-primary ring-primary/15",
    bar: "bg-primary",
    subtle: "bg-primary/10 text-primary",
  },
  teal: {
    icon: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    bar: "bg-cyan-500",
    subtle: "bg-cyan-50 text-cyan-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    bar: "bg-emerald-500",
    subtle: "bg-emerald-50 text-emerald-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    bar: "bg-amber-500",
    subtle: "bg-amber-50 text-amber-700",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    bar: "bg-rose-500",
    subtle: "bg-rose-50 text-rose-700",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 ring-violet-100",
    bar: "bg-violet-500",
    subtle: "bg-violet-50 text-violet-700",
  },
};

export function StudentPageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  tone = "blue",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 gap-4">
        {Icon ? (
          <div
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1",
              toneStyles[tone].icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StudentMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  helper?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <Card className="overflow-hidden rounded-lg border-border/80 shadow-card">
      <div className={cn("h-1", toneStyles[tone].bar)} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {displayValue}
            </div>
            {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              toneStyles[tone].subtle,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentPanel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const hasHeader = title || description || actions;

  return (
    <Card className={cn("rounded-lg border-border/80 shadow-card", className)}>
      {hasHeader ? (
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 p-5">
          <div className="min-w-0">
            {title ? <CardTitle className="text-base leading-6">{title}</CardTitle> : null}
            {description ? (
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(hasHeader ? "p-5 pt-0" : "p-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function StudentEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
