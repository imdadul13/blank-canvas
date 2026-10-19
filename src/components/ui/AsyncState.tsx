import type { LucideIcon } from 'lucide-react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Button, Card } from './Button';
import { IconTile } from './surface';

export function WorkspaceLoadingState({
  label = 'Loading study workspace',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <Card
      role="status"
      aria-live="polite"
      aria-label={label}
      className={compact ? 'mx-auto max-w-3xl p-5' : 'mx-auto min-h-80 max-w-5xl p-5 sm:p-6'}
    >
      <div className={compact ? 'flex items-center gap-3' : 'grid min-h-64 content-center gap-6'}>
        <div className="flex items-center gap-3">
          <IconTile icon={LoaderCircle} color="var(--accent)" className="animate-spin" />
          <div className="space-y-2">
            <span className="t-section block text-[var(--color-ink)]">{label}</span>
            <span className="t-caption block text-[var(--color-ink-3)]">
              Preparing your latest study data…
            </span>
          </div>
        </div>
        {!compact && (
          <div aria-hidden="true" className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-[var(--color-surface-sunken)]"
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function WorkspaceIssueState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = AlertCircle,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <Card role="alert" aria-live="assertive" className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <IconTile icon={Icon} color="var(--color-fail-ink)" />
        <div className="min-w-0 flex-1">
          <span className="t-section block text-[var(--color-ink)]">{title}</span>
          <span className="t-body mt-1 block text-[var(--color-ink-2)]">{description}</span>
        </div>
        {actionLabel && onAction && (
          <Button variant="secondary" size="sm" onClick={onAction} className="shrink-0">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
