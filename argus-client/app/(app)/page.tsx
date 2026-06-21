import { getSummary, getAlerts } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard, Card, CardHeader } from '@/components/ui/Card';
import { AlertCards } from '@/components/AlertsList';
import { EventsTable } from '@/components/EventsTable';
import { DataListCards, CompactDataList } from '@/components/DataListCards';
import {
  BarChart,
  TimelineChart,
  SeverityChart,
  DonutChart,
} from '@/components/charts/Charts';
import Link from 'next/link';

export default async function DashboardPage() {
  let summary;
  let alerts;

  try {
    [summary, alerts] = await Promise.all([getSummary(), getAlerts()]);
  } catch {
    return <ApiError />;
  }

  const totalSources = summary.top_sources.reduce((sum, s) => sum + s.count, 0);
  const sourcesWithPercentage = summary.top_sources.map((s) => ({
    label: s.source,
    value: s.count,
    percentage: (s.count / totalSources) * 100,
  }));

  const totalIPs = summary.top_ips.reduce((sum, ip) => sum + ip.count, 0);
  const ipsWithPercentage = summary.top_ips.slice(0, 5).map((ip) => ({
    label: ip.ip,
    value: ip.count,
    percentage: (ip.count / totalIPs) * 100,
  }));

  return (
    <>
      <PageHeader
        title="Дашборд"
        description="Сводка событий, алертов и активности за текущий период"
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="События"
          value={summary.events_total}
          hint="нормализованных записей"
          accent="pistachio"
        />
        <MetricCard
          label="Алерты"
          value={summary.alerts_total}
          hint="срабатываний правил"
          accent="rose"
        />
        <MetricCard
          label="Критические"
          value={summary.alerts_by_severity.critical}
          hint="требуют немедленной реакции"
          accent="amber"
        />
        <MetricCard
          label="Источников"
          value={summary.top_sources.length}
          hint="активных систем"
          accent="emerald"
        />
      </section>

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

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Источники событий"
            subtitle={`${summary.top_sources.length} активных источников`}
          />
          <DataListCards
            title="Источники"
            data={sourcesWithPercentage}
          />
        </Card>

        <Card>
          <CardHeader title="Распределение алертов по критичности" />
          <div className="space-y-3">
            <CompactDataList
              items={[
                { label: 'Критические', value: summary.alerts_by_severity.critical },
                { label: 'Высокие', value: summary.alerts_by_severity.high },
                { label: 'Средние', value: summary.alerts_by_severity.medium },
                { label: 'Низкие', value: summary.alerts_by_severity.low },
              ]}
            />
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <SeverityChart data={summary.alerts_by_severity} />
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Топ IP адреса"
            subtitle={`${summary.top_ips.length} уникальных адресов`}
          />
          <DataListCards
            title="IP адреса"
            data={ipsWithPercentage}
          />
        </Card>

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
