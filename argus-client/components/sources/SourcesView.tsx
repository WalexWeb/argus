"use client";

import { useState } from "react";
import type { SourceInfo } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { DonutChart, TimelineChart } from "@/components/charts/Charts";
import { formatDate } from "@/lib/utils";

export function SourcesView({
  sources,
  totalEvents,
}: {
  sources: SourceInfo[];
  totalEvents: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    sources[0]?.id ?? null,
  );

  const selected = sources.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => setSelectedId(source.id)}
            className={`w-full rounded-2xl border p-5 text-left transition ${
              selectedId === source.id
                ? "border-pistachio-500/40 bg-pistachio-500/10"
                : "border-white/6 bg-white/2 hover:border-pistachio-500/20"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-zinc-100">{source.name}</h3>
              <StatusDot status={source.status} />
            </div>
            <p className="mt-1 text-xs text-zinc-500">{source.type}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-zinc-600">Событий</p>
                <p className="font-mono text-zinc-300">{source.events_count}</p>
              </div>
              <div>
                <p className="text-zinc-600">Последнее</p>
                <p className="text-zinc-400">
                  {source.last_event_at
                    ? formatDate(source.last_event_at)
                    : "—"}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title={selected.name}
              subtitle={`${selected.protocol} · ${selected.connection_address}`}
            />
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Тип источника" value={selected.type} />
              <DetailField label="Протокол" value={selected.protocol} />
              <DetailField
                label="Статус подключения"
                value={
                  selected.status === "connected" ? "Подключён" : "Отключён"
                }
              />
              <DetailField
                label="Адрес подключения"
                value={selected.connection_address}
                mono
              />
              <DetailField
                label="Зарегистрировано событий"
                value={String(selected.events_count)}
              />
              <DetailField
                label="Ошибок обработки"
                value={String(selected.error_count)}
              />
              <DetailField
                label="Скорость поступления"
                value={`${selected.events_per_hour} событий/час`}
              />
              <DetailField
                label="Последняя синхронизация"
                value={formatDate(selected.last_sync_at)}
              />
            </dl>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Активность источника"
                subtitle="Количество событий за период"
              />
              <TimelineChart data={selected.timeline} />
            </Card>

            <Card>
              <CardHeader
                title="Доля от общего потока"
                subtitle={`${selected.share_percent}% от ${totalEvents} событий`}
              />
              <DonutChart
                data={[
                  { label: selected.name, count: selected.events_count },
                  {
                    label: "Остальные",
                    count: Math.max(totalEvents - selected.events_count, 0),
                  },
                ]}
                labelKey="label"
                valueKey="count"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
        status === "connected" ? "bg-emerald-400" : "bg-zinc-600"
      }`}
      title={status}
    />
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`mt-1 text-sm text-zinc-200 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
