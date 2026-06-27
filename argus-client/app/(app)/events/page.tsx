import { getEvents, getSummary } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventsExplorer } from "@/components/EventsExplorer";
import { Card, CardHeader } from "@/components/ui/Card";
import { CompactDataList } from "@/components/DataListCards";
import { DonutChart, TimelineChart } from "@/components/charts/Charts";
import { MetricsGrid } from "@/components/MetricsGrid"; // новый импорт

export default async function EventsPage() {
  let data;
  let summary;

  try {
    [data, summary] = await Promise.all([getEvents(), getSummary()]);
  } catch {
    return <ApiError />;
  }

  // Вычисления для статистики
  const bySource = Object.entries(
    data.events.reduce(
      (acc, e) => {
        acc[e.source] = (acc[e.source] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const byType = Object.entries(
    data.events.reduce(
      (acc, e) => {
        acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count);

  const topIPs = Object.entries(
    data.events.reduce(
      (acc, e) => {
        if (e.ip) {
          acc[e.ip] = (acc[e.ip] ?? 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topUsers = Object.entries(
    data.events.reduce(
      (acc, e) => {
        if (e.username) {
          acc[e.username] = (acc[e.username] ?? 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="События"
        description="Полный журнал нормализованных событий с поиском и фильтрацией"
      />

      {/* Метрики с выбором */}
      <MetricsGrid
        metrics={[
          {
            id: "total",
            label: "Всего записей",
            value: data.total,
            accent: "pistachio",
          },
          {
            id: "sources",
            label: "Источников",
            value: bySource.length,
            accent: "emerald",
          },
          {
            id: "types",
            label: "Типов событий",
            value: byType.length,
            accent: "amber",
          },
          {
            id: "ips",
            label: "Уникальных IP",
            value: topIPs.length,
            accent: "rose",
          },
        ]}
      />

      {/* Графики */}
      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Таймлайн событий"
            subtitle="Распределение по времени за период"
          />
          <TimelineChart data={summary.timeline} />
        </Card>

        <Card>
          <CardHeader title="По типам" subtitle="Классификация событий" />
          <DonutChart
            data={summary.events_by_type}
            labelKey="event_type"
            valueKey="count"
          />
        </Card>
      </section>

      {/* Активные пользователи */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Активные пользователи"
            subtitle={`${topUsers.length} наиболее активных`}
          />
          {topUsers.length > 0 ? (
            <CompactDataList
              items={topUsers.map((user) => ({
                label: user.username,
                value: user.count,
              }))}
            />
          ) : (
            <p className="text-sm text-zinc-500">Данные отсутствуют</p>
          )}
        </Card>
      </section>

      {/* Таблица событий */}
      <section>
        <EventsExplorer events={data.events} />
      </section>
    </>
  );
}
