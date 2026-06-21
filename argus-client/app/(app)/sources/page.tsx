import { getSummary, getEvents } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { BarChart } from '@/components/charts/Charts';
import { EventsTable } from '@/components/EventsTable';

export default async function SourcesPage() {
  let summary;
  let events;

  try {
    [summary, events] = await Promise.all([getSummary(), getEvents()]);
  } catch {
    return <ApiError />;
  }

  const ipEvents = events.events
    .filter((e) => e.ip)
    .reduce(
      (acc, e) => {
        const ip = e.ip!;
        if (!acc[ip]) {
          acc[ip] = { ip, count: 0, sources: new Set<string>(), types: new Set<string>() };
        }
        acc[ip].count++;
        acc[ip].sources.add(e.source);
        acc[ip].types.add(e.event_type);
        return acc;
      },
      {} as Record<
        string,
        { ip: string; count: number; sources: Set<string>; types: Set<string> }
      >,
    );

  const ipDetails = Object.values(ipEvents)
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      ip: item.ip,
      count: item.count,
      sources: [...item.sources].join(', '),
      types: [...item.types].join(', '),
    }));

  return (
    <>
      <PageHeader
        title="Источники и IP"
        description="Аналитика по системам-источникам и наиболее активным IP-адресам"
      />

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Топ источников"
            subtitle="Системы с наибольшим потоком событий"
          />
          <BarChart
            data={summary.top_sources}
            labelKey="source"
            valueKey="count"
            color="bg-pistachio-600"
          />
        </Card>

        <Card>
          <CardHeader
            title="Топ IP-адресов"
            subtitle="Наиболее активные адреса"
          />
          <BarChart
            data={summary.top_ips}
            labelKey="ip"
            valueKey="count"
            color="bg-pistachio-500"
          />
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader
            title="Детализация по IP"
            subtitle={`${ipDetails.length} уникальных адресов`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">IP</th>
                  <th className="pb-3 pr-4 font-medium">Событий</th>
                  <th className="pb-3 pr-4 font-medium">Источники</th>
                  <th className="pb-3 font-medium">Типы</th>
                </tr>
              </thead>
              <tbody>
                {ipDetails.map((row) => (
                  <tr
                    key={row.ip}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                  >
                    <td className="py-3.5 pr-4 font-mono text-base text-pistachio-400">
                      {row.ip}
                    </td>
                    <td className="py-3 pr-4 font-mono text-zinc-300">
                      {row.count}
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-400">
                      {row.sources}
                    </td>
                    <td className="py-3 text-xs text-zinc-500">{row.types}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            title="События по источникам"
            subtitle="Последние записи из всех систем"
          />
          <EventsTable events={events.events.slice(0, 15)} showDate />
        </Card>
      </section>
    </>
  );
}
