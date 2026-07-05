"use client";

import { useState } from "react";
import Link from "next/link";
import type { Summary } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricsGrid } from "@/components/MetricsGrid";
import { AlertCards } from "@/components/AlertsList";
import {
  DonutChart,
  TimelineChart,
  ProcessingPipeline,
} from "@/components/charts/Charts";

type TimeRange = "hour" | "day" | "week";

const RANGE_LABELS: Record<TimeRange, string> = {
  hour: "Последний час",
  day: "Последние сутки",
  week: "Последняя неделя",
};

export function DashboardView({ summary }: { summary: Summary }) {
  const [range, setRange] = useState<TimeRange>("day");

  const timelineData =
    range === "hour"
      ? summary.timeline_hour
      : range === "week"
        ? summary.timeline_week
        : summary.timeline_day;

  return (
    <>
      <MetricsGrid
        className="lg:grid-cols-3 xl:grid-cols-6"
        metrics={[
          {
            id: "events_total",
            label: "Обработано",
            value: summary.events_total,
            hint: "всего получено",
            accent: "pistachio",
          },
          {
            id: "events_unique",
            label: "Уникальных",
            value: summary.events_unique,
            hint: "после дедупликации",
            accent: "emerald",
          },
          {
            id: "alerts",
            label: "Активных алертов",
            value: summary.alerts_active,
            hint: "требуют внимания",
            accent: "rose",
          },
          {
            id: "sources",
            label: "Источников",
            value: summary.sources_connected,
            hint: "подключённых систем",
            accent: "amber",
          },
          {
            id: "rules",
            label: "Правил корреляции",
            value: summary.correlation_rules_active,
            hint: "активных правил",
            accent: "pistachio",
          },
          {
            id: "processing",
            label: "Ср. время обработки",
            value: `${summary.avg_processing_time_ms} мс`,
            hint: "на одно событие",
            accent: "emerald",
          },
        ]}
      />

      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Интенсивность поступления событий"
            subtitle="Количество событий за выбранный период"
            action={
              <div className="flex gap-2">
                {(Object.keys(RANGE_LABELS) as TimeRange[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      range === key
                        ? "bg-pistachio-500/20 text-pistachio-300 ring-1 ring-pistachio-500/40"
                        : "bg-white/4 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {RANGE_LABELS[key]}
                  </button>
                ))}
              </div>
            }
          />
          <TimelineChart data={timelineData} />
        </Card>

        <Card>
          <CardHeader
            title="Распределение по типам"
            subtitle="Категории событий"
          />
          <DonutChart
            data={summary.events_by_type}
            labelKey="event_type"
            valueKey="count"
          />
        </Card>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Распределение по критичности"
            subtitle="Уровни severity событий"
          />
          <DonutChart
            data={summary.events_by_severity.map((s) => ({
              severity: s.severity,
              count: s.count,
            }))}
            labelKey="severity"
            valueKey="count"
          />
        </Card>

        <Card>
          <CardHeader
            title="Конвейер обработки"
            subtitle="Этапы прохождения событий"
          />
          <ProcessingPipeline pipeline={summary.pipeline} />
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            title="Последние обнаруженные алерты"
            subtitle={`${summary.recent_alerts.length} из ${summary.alerts_total}`}
            action={
              <Link
                href="/correlation"
                className="text-sm font-medium text-pistachio-400 hover:text-pistachio-300"
              >
                Расследование →
              </Link>
            }
          />
          <AlertCards alerts={summary.recent_alerts} linkToInvestigation />
        </Card>
      </section>
    </>
  );
}
