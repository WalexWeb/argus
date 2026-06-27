import { getSummary, getAlerts } from "@/lib/api";
import { ApiError } from "@/components/ApiError";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { AlertCards } from "@/components/AlertsList";
import { EventsTable } from "@/components/EventsTable";
import { MetricsGrid } from "@/components/MetricsGrid";
import Link from "next/link";

export default async function DashboardPage() {
  let summary;
  let alerts;

  try {
    [summary, alerts] = await Promise.all([getSummary(), getAlerts()]);
  } catch {
    return <ApiError />;
  }

  // Эти вычисления пока не используются, но оставляем на будущее
  // const totalSources = summary.top_sources.reduce((sum, s) => sum + s.count, 0);
  // const sourcesWithPercentage = summary.top_sources.map((s) => ({
  //   label: s.source,
  //   value: s.count,
  //   percentage: (s.count / totalSources) * 100,
  // }));

  // const totalIPs = summary.top_ips.reduce((sum, ip) => sum + ip.count, 0);
  // const ipsWithPercentage = summary.top_ips.slice(0, 5).map((ip) => ({
  //   label: ip.ip,
  //   value: ip.count,
  //   percentage: (ip.count / totalIPs) * 100,
  // }));

  return (
    <>
      <PageHeader
        title="Дашборд"
        description="Сводка событий, алертов и активности за текущий период"
      />

      <MetricsGrid
        metrics={[
          {
            id: "events",
            label: "События",
            value: summary.events_total,
            hint: "нормализованных записей",
            accent: "pistachio",
          },
          {
            id: "alerts",
            label: "Алерты",
            value: summary.alerts_total,
            hint: "срабатываний правил",
            accent: "rose",
          },
          {
            id: "critical",
            label: "Критические",
            value: summary.alerts_by_severity.critical,
            hint: "требуют немедленной реакции",
            accent: "amber",
          },
          {
            id: "sources",
            label: "Источников",
            value: summary.top_sources.length,
            hint: "активных систем",
            accent: "emerald",
          },
        ]}
      />

      {/*
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
      */}

      <section className="grid gap-6">
        <Card>
          <CardHeader
            title="Последние алерты"
            subtitle={`${alerts.total} всего срабатываний`}
            action={
              <Link
                href="/alerts"
                className="text-sm font-medium text-pistachio-400 hover:text-pistachio-300"
              >
                Все →
              </Link>
            }
          />
          <AlertCards alerts={alerts.alerts.slice(0, 3)} />
        </Card>
      </section>

      <section className="grid gap-6">
        <Card>
          <CardHeader
            title="Последние события"
            subtitle={`${summary.recent_events.length} последних записей`}
            action={
              <Link
                href="/events"
                className="text-sm font-medium text-pistachio-400 hover:text-pistachio-300"
              >
                Все →
              </Link>
            }
          />
          <EventsTable events={summary.recent_events.slice(0, 5)} />
        </Card>
      </section>
    </>
  );
}
