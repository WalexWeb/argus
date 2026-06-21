'use client';

import { cn } from '@/lib/utils';

export function BarChart({
  data,
  labelKey,
  valueKey,
  color = 'bg-pistachio-500',
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);

  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={i} className="group">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-zinc-400 group-hover:text-zinc-300">
              {String(item[labelKey])}
            </span>
            <span className="ml-2 font-mono text-base text-zinc-300">{item[valueKey]}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className={cn('h-full rounded-full transition-all duration-500', color)}
              style={{ width: `${(Number(item[valueKey]) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineChart({
  data,
}: {
  data: { hour: string; count: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((point) => (
        <div
          key={point.hour}
          className="group relative flex flex-1 flex-col items-center"
        >
          <div className="absolute -top-7 hidden rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300 group-hover:block">
            {point.count}
          </div>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-pistachio-600 to-pistachio-400 opacity-85 transition-all group-hover:opacity-100"
            style={{
              height: `${Math.max((point.count / max) * 100, 4)}%`,
            }}
          />
          <span className="mt-2 text-xs text-zinc-600">
            {point.hour.slice(11, 16)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  data,
  labelKey,
  valueKey,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
}) {
  const total = data.reduce((s, d) => s + Number(d[valueKey]), 0);
  const colors = [
    'bg-pistachio-500',
    'bg-pistachio-400',
    'bg-pistachio-600',
    'bg-emerald-500',
    'bg-lime-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-4">
      <div className="flex h-3.5 overflow-hidden rounded-full">
        {data.map((item, i) => (
          <div
            key={i}
            className={cn(colors[i % colors.length], 'transition-all')}
            style={{
              width: `${(Number(item[valueKey]) / total) * 100}%`,
            }}
            title={`${item[labelKey]}: ${item[valueKey]}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={cn('h-2.5 w-2.5 rounded-full', colors[i % colors.length])} />
            <span className="truncate text-zinc-400">{String(item[labelKey])}</span>
            <span className="ml-auto font-mono text-zinc-300">{item[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeverityChart({
  data,
}: {
  data: { critical: number; high: number; medium: number; low: number };
}) {
  const items = [
    { label: 'Критический', value: data.critical, color: 'bg-red-500' },
    { label: 'Высокий', value: data.high, color: 'bg-orange-500' },
    { label: 'Средний', value: data.medium, color: 'bg-amber-500' },
    { label: 'Низкий', value: data.low, color: 'bg-sky-500' },
  ];
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-white/[0.02] p-5">
          <p className="text-sm text-zinc-500">{item.label}</p>
          <p className="mt-1 text-3xl font-bold text-zinc-100">{item.value}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className={cn('h-full rounded-full', item.color)}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
