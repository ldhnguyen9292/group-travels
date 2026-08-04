import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-dashed border-border px-4 py-6 text-center'
          : 'rounded-card border border-dashed border-border px-6 py-12 text-center'
      }
    >
      {icon && (
        <div className="puck mx-auto mb-3 h-12 w-12 rounded-2xl ring-1 ring-brand-border">
          {icon}
        </div>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
