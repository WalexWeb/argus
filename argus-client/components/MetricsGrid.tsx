"use client";

import { useState } from "react";
import { MetricCard } from "@/components/ui/Card";
import { Settings } from "lucide-react";

export interface Metric {
  id: string;
  label: string;
  value: number | string;
  hint?: string;
  accent?: "pistachio" | "rose" | "amber" | "emerald" | "sky" | "violet";
}

interface MetricsGridProps {
  metrics: Metric[];
  defaultVisible?: string[];
  className?: string;
}

export function MetricsGrid({
  metrics,
  defaultVisible,
  className,
}: MetricsGridProps) {
  const allIds = metrics.map((m) => m.id);
  const [visibleIds, setVisibleIds] = useState<string[]>(
    defaultVisible ?? allIds,
  );
  const [isOpen, setIsOpen] = useState(false);

  const toggleMetric = (id: string) => {
    setVisibleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setVisibleIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const visibleMetrics = metrics.filter((m) => visibleIds.includes(m.id));

  return (
    <div className="space-y-4 relative mb-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition"
        >
          <Settings className="h-4 w-4" />
          Настроить метрики
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 z-10 mt-1 w-56 rounded-md bg-zinc-900 border border-zinc-700 shadow-lg p-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={visibleIds.length === allIds.length}
                  onChange={toggleAll}
                  className="rounded border-zinc-600 bg-zinc-800 text-pistachio-400 focus:ring-pistachio-400"
                />
                Все
              </label>
              {metrics.map((metric) => (
                <label
                  key={metric.id}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:text-zinc-200"
                >
                  <input
                    type="checkbox"
                    checked={visibleIds.includes(metric.id)}
                    onChange={() => toggleMetric(metric.id)}
                    className="rounded border-zinc-600 bg-zinc-800 text-pistachio-400 focus:ring-pistachio-400"
                  />
                  {metric.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className || ""}`}
      >
        {visibleMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </div>
    </div>
  );
}
