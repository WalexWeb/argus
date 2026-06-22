'use client';

interface DataItem {
  label: string;
  value: number;
  percentage?: number;
}

export function DataListCards({ title, data }: { title: string; data: DataItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
        <p className="text-sm">Нет данных</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="rounded-lg border border-white/6 bg-white/2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-300">{item.label}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-linear-to-r from-pistachio-500 to-pistachio-400"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-semibold text-pistachio-400">
                {item.value}
              </p>
              {item.percentage !== undefined && (
                <p className="text-xs text-zinc-500">{item.percentage.toFixed(1)}%</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompactDataList({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg bg-white/2 px-3 py-2"
        >
          <span className="text-sm text-zinc-400">{item.label}</span>
          <span className="font-mono text-sm font-semibold text-pistachio-400">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
