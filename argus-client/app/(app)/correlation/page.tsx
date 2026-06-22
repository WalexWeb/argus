import { getRules, getCorrelationGraph, getAlerts } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { CorrelationView } from '@/components/correlation/CorrelationView';
import { Card, CardHeader } from '@/components/ui/Card';
import { SeverityBadge } from '@/components/ui/Badge';

export default async function CorrelationPage() {
  let rules;
  let graph;
  let alerts;

  try {
    [rules, graph, alerts] = await Promise.all([
      getRules(),
      getCorrelationGraph(),
      getAlerts(),
    ]);
  } catch {
    return <ApiError />;
  }

  return (
    <>
      <PageHeader
        title="Корреляция"
        description="Визуализация цепочек: источник → IP → пользователь → алерт"
      />

      <CorrelationView
        nodes={graph.nodes}
        edges={graph.edges}
        alerts={alerts.alerts}
        rules={rules.rules}
      />

      <section className="mt-10">
        <Card>
          <CardHeader
            title="Правила корреляции"
            subtitle="Конфигурация из correlation-rules.json"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {rules.rules.map((rule) => {
              const triggered = alerts.alerts.filter(
                (a) => a.rule === rule.rule,
              );

              return (
                <div
                  key={rule.rule}
                  className="rounded-2xl border border-white/6 bg-white/2 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm text-pistachio-400">{rule.rule}</p>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-100">
                        {rule.name}
                      </h3>
                    </div>
                    <SeverityBadge
                      severity={
                        rule.severity as 'critical' | 'high' | 'medium' | 'low'
                      }
                    />
                  </div>

                  <p className="mt-3 text-base text-zinc-400">{rule.description}</p>

                  <div className="mt-4 rounded-xl bg-black/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Условие
                    </p>
                    <code className="mt-1 block font-mono text-sm leading-relaxed text-pistachio-300">
                      {rule.condition}
                    </code>
                  </div>

                  {triggered.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-white/6 pt-4">
                      {triggered.map((alert) => (
                        <li
                          key={alert.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-zinc-300">#{alert.id} {alert.name}</span>
                          <SeverityBadge severity={alert.severity} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </>
  );
}
