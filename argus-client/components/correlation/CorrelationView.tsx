'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Alert, CorrelationRule, GraphEdge, GraphNode } from '@/lib/api';
import { SeverityBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { nodeTypes } from './CorrelationNodes';
import { GROUP_LABELS } from './constants';
import {
  buildFlowEdges,
  clusterEdgeMapper,
  getConnectedNodeIds,
  getRuleNodeIds,
  layoutAlertClusters,
  layoutGraphNodes,
} from './layout';

function EvidenceBlock({ evidence }: { evidence: Record<string, unknown> }) {
  const entries = Object.entries(evidence);
  if (entries.length === 0) return null;

  return (
    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl bg-black/30 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{key}</dt>
          <dd className="mt-1 break-all font-mono text-sm text-pistachio-300">
            {typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CorrelationView({
  nodes,
  edges,
  alerts,
  rules,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  alerts: Alert[];
  rules: CorrelationRule[];
}) {
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const alertRules = useMemo(
    () => new Set(rules.map((r) => r.rule)),
    [rules],
  );

  const focusIds = useMemo(() => {
    if (selectedAlertId !== null) {
      return getConnectedNodeIds(`alert:${selectedAlertId}`, edges);
    }
    if (selectedRule) {
      return getRuleNodeIds(selectedRule, edges);
    }
    return null;
  }, [selectedAlertId, selectedRule, edges]);

  const useClusterLayout = focusIds === null;

  const { flowNodes, flowEdges, visibleOriginalIds } = useMemo(() => {
    if (useClusterLayout) {
      const laidOut = layoutAlertClusters(nodes, edges, alerts);
      const visibleOriginalIds = new Set<string>();

      for (const node of laidOut) {
        const originalId = (node.data as { originalId?: string }).originalId;
        if (originalId) visibleOriginalIds.add(originalId);
      }

      const flowNodes: Node[] = laidOut.map((node) => ({
        ...node,
        data: {
          ...node.data,
          highlighted:
            selectedNodeId === node.id ||
            (node.data as { originalId?: string }).originalId === selectedNodeId,
        },
      }));

      const flowEdges: Edge[] = [];
      let edgeIndex = 0;

      for (const alert of alerts) {
        const clusterIds = getConnectedNodeIds(`alert:${alert.id}`, edges);
        const clusterEdges = edges.filter(
          (e) => clusterIds.has(e.from) && clusterIds.has(e.to),
        );

        for (const edge of clusterEdges) {
          const isAlert = alertRules.has(edge.label);
          flowEdges.push({
            id: `edge-${edgeIndex++}`,
            source: clusterEdgeMapper(alert.id, edge.from),
            target: clusterEdgeMapper(alert.id, edge.to),
            label: isAlert ? edge.label : undefined,
            type: 'smoothstep',
            animated: isAlert,
            style: {
              stroke: isAlert ? '#f87171' : '#5a9e4b',
              strokeWidth: isAlert ? 2.5 : 1.2,
            },
            labelStyle: { fill: '#fca5a5', fontSize: 12, fontWeight: 600 },
            labelBgStyle: { fill: '#0a0c0a', fillOpacity: 0.95 },
            labelBgPadding: [8, 5],
            labelBgBorderRadius: 8,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isAlert ? '#f87171' : '#5a9e4b',
            },
          });
        }
      }

      return { flowNodes, flowEdges, visibleOriginalIds };
    }

    const laidOut = layoutGraphNodes(nodes, edges, focusIds!);
    const flowNodes = laidOut.map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlighted: selectedNodeId === node.id,
      },
    }));

    const flowEdges = buildFlowEdges(edges, alertRules, focusIds!).map((e) => ({
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed, color: (e.style as { stroke?: string })?.stroke ?? '#5a9e4b' },
    }));

    return { flowNodes, flowEdges, visibleOriginalIds: focusIds! };
  }, [
    useClusterLayout,
    nodes,
    edges,
    alerts,
    focusIds,
    alertRules,
    selectedNodeId,
  ]);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) ?? null;
  const selectedNode = selectedNodeId
    ? nodes.find(
        (n) =>
          n.id === selectedNodeId ||
          n.id === (selectedNodeId.split('@')[0] ?? selectedNodeId),
      ) ?? null
    : null;

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNodeId(node.id);
    const data = node.data as { originalId?: string; clusterAlertId?: number };
    const alertId =
      data.clusterAlertId ??
      (node.id.startsWith('alert:')
        ? Number(node.id.replace('alert:', '').split('@')[0])
        : null);

    if (alertId) {
      setSelectedAlertId(alertId);
      setSelectedRule(null);
    }
  }, []);

  const clearFilters = () => {
    setSelectedAlertId(null);
    setSelectedRule(null);
    setSelectedNodeId(null);
  };

  const statsLabel = useClusterLayout
    ? `${alerts.length} корреляций · ${flowNodes.length} узлов · ${flowEdges.length} связей`
    : `${visibleOriginalIds.size} узлов · ${flowEdges.length} связей`;

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-500">Фокус:</span>
          <button
            onClick={clearFilters}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              !selectedAlertId && !selectedRule
                ? 'bg-pistachio-500/20 text-pistachio-300 ring-1 ring-pistachio-500/40'
                : 'bg-white/4 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Все корреляции
          </button>
          {(selectedAlertId || selectedRule) && (
            <button
              onClick={clearFilters}
              className="text-sm text-pistachio-400 hover:text-pistachio-300"
            >
              ✕ Сбросить фильтр
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => {
                setSelectedAlertId(alert.id);
                setSelectedRule(null);
                setSelectedNodeId(`alert:${alert.id}`);
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                selectedAlertId === alert.id
                  ? 'border-pistachio-500/50 bg-pistachio-500/15'
                  : 'border-white/6 bg-white/2 hover:border-pistachio-500/30'
              }`}
            >
              <SeverityBadge severity={alert.severity} />
              <span className="text-sm font-medium text-zinc-200">{alert.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/6 pt-3">
          <span className="mr-1 self-center text-xs text-zinc-600">Правила:</span>
          {rules.map((rule) => (
            <button
              key={rule.rule}
              onClick={() => {
                setSelectedRule(selectedRule === rule.rule ? null : rule.rule);
                setSelectedAlertId(null);
                setSelectedNodeId(null);
              }}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs transition ${
                selectedRule === rule.rule
                  ? 'bg-pistachio-500/20 text-pistachio-300'
                  : 'bg-white/4 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {rule.rule}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden p-0 ring-1 ring-pistachio-500/10">
        <div className="flex items-center justify-between border-b border-pistachio-500/10 bg-pistachio-500/5 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-50">Граф корреляций</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {statsLabel} · Источник → IP → Пользователь → Алерт
            </p>
          </div>
          <p className="hidden text-sm text-zinc-600 sm:block">
            Колёсико — масштаб · Перетаскивание — перемещение
          </p>
        </div>

        {flowNodes.length === 0 ? (
          <div className="flex h-160 w-full items-center justify-center text-base text-zinc-500">
            Нет данных для отображения графа
          </div>
        ) : (
          <div className="h-160 w-full">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.35, maxZoom: 1.2 }}
              minZoom={0.08}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'smoothstep' }}
              className="h-full w-full"
            >
              <Background color="#3a4a36" gap={24} size={1.5} />
              <Controls
                position="bottom-right"
                className="rounded-xl! border-white/10! bg-[#111411]/90! shadow-lg! [&>button]:border-white/10! [&>button]:bg-transparent! [&>button]:text-zinc-300! [&>button:hover]:bg-white/5!"
              />
            </ReactFlow>
          </div>
        )}
      </div>

      {(selectedAlert || selectedNode) && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-zinc-100">Детали выбранного узла</h3>
          {selectedAlert && (
            <div className="mt-4">
              <div className="flex flex-wrap items-start gap-3">
                <p className="font-mono text-sm text-pistachio-400">{selectedAlert.rule}</p>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>
              <p className="mt-2 text-xl font-semibold text-zinc-100">{selectedAlert.name}</p>
              <p className="mt-1 text-base text-zinc-400">{selectedAlert.description}</p>
              <p className="mt-2 text-sm text-zinc-600">
                {formatDate(selectedAlert.triggered_at)} ·{' '}
                {selectedAlert.related_events.length} связанных событий
              </p>
              <EvidenceBlock evidence={selectedAlert.evidence} />
            </div>
          )}
          {!selectedAlert && selectedNode && (
            <div className="mt-4">
              <p className="text-sm text-zinc-500">
                {GROUP_LABELS[selectedNode.group] ?? selectedNode.group}
              </p>
              <p className="mt-1 break-all font-mono text-lg text-pistachio-300">
                {selectedNode.label}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
