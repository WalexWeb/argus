import { cn } from '@/lib/utils';

const STYLES = {
  critical: 'bg-red-500/15 text-red-400 ring-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  low: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
};

const LABELS = {
  critical: 'Критический',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: keyof typeof STYLES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset',
        STYLES[severity] ?? STYLES.low,
        className,
      )}
    >
      {LABELS[severity] ?? severity}
    </span>
  );
}

export function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    login_failed: 'text-red-400 bg-red-500/10',
    login_success: 'text-emerald-400 bg-emerald-500/10',
    intrusion_detected: 'text-orange-400 bg-orange-500/10',
    email_access: 'text-pistachio-400 bg-pistachio-500/10',
    file_access: 'text-amber-400 bg-amber-500/10',
    http_request: 'text-sky-400 bg-sky-500/10',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2.5 py-1 font-mono text-sm',
        colors[type] ?? 'text-zinc-400 bg-zinc-500/10',
      )}
    >
      {type}
    </span>
  );
}
