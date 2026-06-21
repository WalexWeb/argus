import { getRules, getCorrelationGraph, getAlerts } from '@/lib/api';
import { ApiError } from '@/components/ApiError';
import { PageHeader } from '@/components/layout/PageHeader';
import { CorrelationGraph } from '@/components/CorrelationGraph';
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
        description="Правила связывания событий и граф связей между IP, пользователями и системами"
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-base text-zinc-500">Правил</p>
          <p className="mt-1 text-4xl font-bold text-zinc-50">{rules.rules.length}</p>
        </Card>
        <Card>
          <p className="text-base text-zinc-500">Узлов графа</p>
          <p className="mt-1 text-4xl font-bold text-zinc-50">{graph.nodes.length}</p>
        </Card>
        <Card>
          <p className="text-base text-zinc-500">Связей</p>
          <p className="mt-1 text-4xl font-bold text-zinc-50">{graph.edges.length}</p>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader
            title="Граф корреляции"
            subtitle="IP ↔ пользователи ↔ источники ↔ алерты"
          />
          <CorrelationGraph nodes={graph.nodes} edges={graph.edges} />
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            title="Правила корреляции"
            subtitle="JSON-конфигурация из correlation-rules.json"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {rules.rules.map((rule) => {
              const triggered = alerts.alerts.filter(
                (a) => a.rule === rule.rule,
              ).length;

              return (
                <div
                  key={rule.rule}
                  className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-pistachio-400">
                        {rule.rule}
                      </p>
                      <h3 className="mt-1 font-semibold text-zinc-100">
                        {rule.name}
                      </h3>
                    </div>
                    <SeverityBadge
                      severity={
                        rule.severity as 'critical' | 'high' | 'medium' | 'low'
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">{rule.description}</p>
                  <div className="mt-3 rounded-lg bg-black/30 p-3">
                    <code className="block font-mono text-sm leading-relaxed text-pistachio-400/70">
                      {rule.condition}
                    </code>
                  </div>
                  <p className="mt-3 text-xs text-zinc-600">
                    Срабатываний:{' '}
                    <span className="font-mono text-zinc-400">{triggered}</span>
                    {' · '}
                    Действие:{' '}
                    <span className="font-mono text-zinc-400">{rule.action}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </>
  );
}
