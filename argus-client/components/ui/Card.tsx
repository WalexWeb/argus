import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn('glass-card', padding && 'p-6', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-base text-zinc-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  trend,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  trend?: string;
  accent?: 'pistachio' | 'emerald' | 'amber' | 'rose';
}) {
  const accents = {
    pistachio: 'from-pistachio-500/20 to-transparent border-pistachio-500/25',
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/20',
    amber: 'from-amber-500/20 to-transparent border-amber-500/20',
    rose: 'from-rose-500/20 to-transparent border-rose-500/20',
  };

  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden p-6',
        accent && `bg-gradient-to-br ${accents[accent]}`,
      )}
    >
      <p className="text-base font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">
        {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
      </p>
      {(hint || trend) && (
        <p className="mt-2 text-sm text-zinc-500">
          {trend && <span className="text-pistachio-400">{trend} </span>}
          {hint}
        </p>
      )}
    </div>
  );
}
