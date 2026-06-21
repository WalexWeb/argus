import { getEvents } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventsExplorer } from '@/components/EventsExplorer';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataListCards, CompactDataList } from '@/components/DataListCards';
import { DonutChart } from '@/components/charts/Charts';

export default async function EventsPage() {
  let data;

  try {
    data = await getEvents();
  } catch {
    return <ApiError />;
  }

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

  const totalSourceCount = bySource.reduce((sum, s) => sum + s.count, 0);
  const sourcesWithPercentage = bySource.map((s) => ({
    label: s.source,
    value: s.count,
    percentage: (s.count / totalSourceCount) * 100,
  }));

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

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Всего записей</p>
            <p className="mt-2 text-3xl font-bold text-pistachio-400">{data.total}</p>
          </div>
        </Card>
        <Card padding>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Источников</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">{bySource.length}</p>
          </div>
        </Card>
        <Card padding>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Типов событий</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">{byType.length}</p>
          </div>
        </Card>
        <Card padding>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Уникальных IP</p>
            <p className="mt-2 text-3xl font-bold text-rose-400">{topIPs.length}</p>
          </div>
        </Card>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="По источникам"
            subtitle={`${bySource.length} активных источников`}
          />
          <DataListCards
            title="Источники"
            data={sourcesWithPercentage}
          />
        </Card>

        <Card>
          <CardHeader title="По типам событий" />
          <DonutChart data={byType} labelKey="event_type" valueKey="count" />
        </Card>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Топ IP адреса"
            subtitle={`${topIPs.length} наиболее активных`}
          />
          {topIPs.length > 0 ? (
            <CompactDataList
              items={topIPs.map((ip) => ({
                label: ip.ip,
                value: ip.count,
              }))}
            />
          ) : (
            <p className="text-sm text-zinc-500">Данные отсутствуют</p>
          )}
        </Card>

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

      <section>
        <EventsExplorer events={data.events} />
      </section>
    </>
  );
}
