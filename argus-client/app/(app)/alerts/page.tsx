import { getAlerts, getRules } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertsTable } from '@/components/AlertsList';
import { Card, CardHeader } from '@/components/ui/Card';
import { CompactDataList } from '@/components/DataListCards';
import { SeverityChart } from '@/components/charts/Charts';
import { SeverityBadge } from '@/components/ui/Badge';

export default async function AlertsPage() {
  let alerts;
  let rules;

  try {
    [alerts, rules] = await Promise.all([getAlerts(), getRules()]);
  } catch {
    return <ApiError />;
  }

  const severityCounts = {
    critical: alerts.alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.alerts.filter((a) => a.severity === 'low').length,
  };

  const totalAlerts = Object.values(severityCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        title="Алерты"
        description="Срабатывания правил корреляции — подозрительные цепочки и аномалии"
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding>
          <div className="rounded-lg bg-linear-to-br from-rose-500/20 to-rose-600/10 p-4">
            <p className="text-sm font-semibold text-rose-300">Критические</p>
            <p className="mt-2 text-3xl font-bold text-rose-400">
              {severityCounts.critical}
            </p>
            <p className="mt-1 text-xs text-rose-300/70">
              {((severityCounts.critical / totalAlerts) * 100).toFixed(1)}% от всех
            </p>
          </div>
        </Card>

        <Card padding>
          <div className="rounded-lg bg-linear-to-br from-amber-500/20 to-amber-600/10 p-4">
            <p className="text-sm font-semibold text-amber-300">Высокие</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">
              {severityCounts.high}
            </p>
            <p className="mt-1 text-xs text-amber-300/70">
              {((severityCounts.high / totalAlerts) * 100).toFixed(1)}% от всех
            </p>
          </div>
        </Card>

        <Card padding>
          <div className="rounded-lg bg-linear-to-br from-yellow-500/20 to-yellow-600/10 p-4">
            <p className="text-sm font-semibold text-yellow-300">Средние</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {severityCounts.medium}
            </p>
            <p className="mt-1 text-xs text-yellow-300/70">
              {((severityCounts.medium / totalAlerts) * 100).toFixed(1)}% от всех
            </p>
          </div>
        </Card>

        <Card padding>
          <div className="rounded-lg bg-linear-to-br from-emerald-500/20 to-emerald-600/10 p-4">
            <p className="text-sm font-semibold text-emerald-300">Низкие</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {severityCounts.low}
            </p>
            <p className="mt-1 text-xs text-emerald-300/70">
              {((severityCounts.low / totalAlerts) * 100).toFixed(1)}% от всех
            </p>
          </div>
        </Card>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Таблица алертов"
            subtitle={`${alerts.total} всего срабатываний`}
          />
          <AlertsTable alerts={alerts.alerts} />
        </Card>

        <Card>
          <CardHeader title="Статистика" />
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500 mb-3 font-semibold uppercase">
                По критичности
              </p>
              <CompactDataList
                items={[
                  { label: 'Критические', value: severityCounts.critical },
                  { label: 'Высокие', value: severityCounts.high },
                  { label: 'Средние', value: severityCounts.medium },
                  { label: 'Низкие', value: severityCounts.low },
                ]}
              />
            </div>
            <div className="border-t border-white/6 pt-4">
              <p className="text-xs text-zinc-500 mb-3 font-semibold uppercase">
                График
              </p>
              <SeverityChart data={severityCounts} />
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader
            title="Связанные правила"
            subtitle={`${rules.rules.length} активных правил корреляции`}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {rules.rules.map((rule) => (
              <div
                key={rule.rule}
                className="rounded-xl border border-white/6 bg-white/2 p-5 transition hover:border-pistachio-500/20 hover:bg-white/3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-100">{rule.name}</h3>
                      <SeverityBadge
                        severity={rule.severity as 'critical' | 'high' | 'medium' | 'low'}
                      />
                    </div>
                    <p className="mt-1.5 text-sm text-zinc-500 font-mono">
                      {rule.rule}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-400">{rule.description}</p>
                <div className="mt-3 rounded-lg bg-black/30 p-3">
                  <p className="text-xs text-zinc-600 mb-1 uppercase">Условие</p>
                  <code className="block font-mono text-xs leading-relaxed text-pistachio-400/80 wrap-break-word">
                    {rule.condition}
                  </code>
                </div>
                {rule.action && (
                  <div className="mt-2 rounded-lg bg-white/2 p-3">
                    <p className="text-xs text-zinc-600 mb-1 uppercase">Действие</p>
                    <p className="text-sm text-zinc-300">{rule.action}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
