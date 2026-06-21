import type { GraphNode, GraphEdge } from '@/lib/api';
import { cn } from '@/lib/utils';

const GROUP_STYLES: Record<string, { bg: string; ring: string; label: string }> = {
  ip: { bg: 'bg-pistachio-500/20', ring: 'ring-pistachio-500/40', label: 'IP' },
  user: { bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/40', label: 'User' },
  source: { bg: 'bg-lime-500/20', ring: 'ring-lime-500/40', label: 'Source' },
  alert: { bg: 'bg-red-500/20', ring: 'ring-red-500/40', label: 'Alert' },
};

export function CorrelationGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const grouped = nodes.reduce(
    (acc, node) => {
      const g = node.group || 'other';
      if (!acc[g]) acc[g] = [];
      acc[g].push(node);
      return acc;
    },
    {} as Record<string, GraphNode[]>,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(grouped).map(([group, groupNodes]) => {
          const style = GROUP_STYLES[group] ?? {
            bg: 'bg-zinc-500/20',
            ring: 'ring-zinc-500/40',
            label: group,
          };

          return (
            <div key={group} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                {style.label} ({groupNodes.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {groupNodes.map((node) => (
                  <span
                    key={node.id}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-sm font-mono ring-1 ring-inset',
                      style.bg,
                      style.ring,
                    )}
                  >
                    {node.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Связи ({edges.length})
        </p>
        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {edges.slice(0, 50).map((edge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 font-mono text-sm text-zinc-400"
            >
              <span className="truncate text-pistachio-400">{edge.from.replace(/^[^:]+:/, '')}</span>
              <span className="text-zinc-600">→</span>
              <span className="truncate text-emerald-400">{edge.to.replace(/^[^:]+:/, '')}</span>
              <span className="ml-auto shrink-0 rounded-lg bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-500">
                {edge.label}
              </span>
            </div>
          ))}
          {edges.length > 50 && (
            <p className="pt-2 text-sm text-zinc-600">
              ... и ещё {edges.length - 50} связей
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
