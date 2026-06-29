"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  Alert,
  CorrelationRule,
  GraphEdge,
  GraphNode,
  SecurityEvent,
} from "@/lib/api";
import { getAlertTimeline, getCorrelationGraph } from "@/lib/api";
import { SeverityBadge } from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/utils";
import { nodeTypes } from "./CorrelationNodes";
import { GROUP_LABELS } from "./constants";
import {
  buildFlowEdges,
  getConnectedNodeIds,
  layoutGraphNodes,
} from "./layout";

function InvestigationTimeline({
  events,
  alert,
}: {
  events: SecurityEvent[];
  alert: Alert;
}) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">
        Нет связанных событий для временной шкалы
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 py-4">
      {events.map((event) => (
        <div key={event.id} className="flex flex-col items-center">
          <div className="rounded-xl border border-white/6 bg-white/3 px-4 py-2 text-center">
            <p className="font-mono text-xs text-zinc-500">
              {formatTime(event.timestamp)}
            </p>
            <p className="text-sm font-medium text-zinc-200">
              {event.event_type}
            </p>
            {event.ip && (
              <p className="mt-0.5 font-mono text-xs text-pistachio-400">
                {event.ip}
              </p>
            )}
          </div>
          <div className="py-1 text-zinc-600">↓</div>
        </div>
      ))}
      <div className="rounded-xl border border-pistachio-500/30 bg-pistachio-500/10 px-5 py-3 text-center">
        <p className="font-mono text-sm font-semibold text-pistachio-300">
          {alert.rule}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{alert.name}</p>
      </div>
    </div>
  );
}

function NodeInfoPanel({
  node,
  events,
}: {
  node: GraphNode;
  events: SecurityEvent[];
}) {
  const group = node.group;

  if (group === "ip") {
    const related = events.filter((e) => e.ip === node.label);
    const users = [...new Set(related.map((e) => e.username).filter(Boolean))];
    return (
      <dl className="mt-3 space-y-2 text-sm">
        <Field label="Адрес" value={node.label} />
        <Field label="Страна" value={related[0]?.country ?? "—"} />
        <Field label="Количество событий" value={String(related.length)} />
        <Field
          label="Первое появление"
          value={
            related.length
              ? formatDate(related[related.length - 1].timestamp)
              : "—"
          }
        />
        <Field
          label="Последнее появление"
          value={related.length ? formatDate(related[0].timestamp) : "—"}
        />
        <Field label="Связанные пользователи" value={users.join(", ") || "—"} />
      </dl>
    );
  }

  if (group === "user") {
    const related = events.filter((e) => e.username === node.label);
    const ips = [...new Set(related.map((e) => e.ip).filter(Boolean))];
    return (
      <dl className="mt-3 space-y-2 text-sm">
        <Field label="Имя" value={node.label} />
        <Field
          label="Количество входов"
          value={String(
            related.filter((e) => e.event_type.includes("login")).length,
          )}
        />
        <Field label="Используемые IP" value={ips.join(", ") || "—"} />
        <Field label="Количество событий" value={String(related.length)} />
      </dl>
    );
  }

  if (group === "alert") {
    return null;
  }

  return (
    <dl className="mt-3 space-y-2 text-sm">
      <Field label="Тип" value={GROUP_LABELS[group] ?? group} />
      <Field label="Значение" value={node.label} />
    </dl>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-mono text-zinc-200">{value}</dd>
    </div>
  );
}

export function CorrelationView({
  alerts,
  rules,
  initialAlertId,
}: {
  alerts: Alert[];
  rules: CorrelationRule[];
  initialAlertId?: number;
}) {
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(
    initialAlertId ?? alerts[0]?.id ?? null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) ?? null;
  const selectedRule = selectedAlert
    ? rules.find((r) => r.rule === selectedAlert.rule)
    : null;

  useEffect(() => {
    if (!selectedAlertId) return;

    setLoading(true);
    Promise.all([
      getCorrelationGraph(selectedAlertId),
      getAlertTimeline(selectedAlertId),
    ])
      .then(([graph, timeline]) => {
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setTimelineEvents(timeline.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAlertId]);

  const visibleIds = useMemo(() => {
    if (!selectedAlertId) return new Set<string>();
    return getConnectedNodeIds(`alert:${selectedAlertId}`, edges);
  }, [selectedAlertId, edges]);

  const flowNodes = useMemo(() => {
    return layoutGraphNodes(nodes, edges, visibleIds).map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlighted: selectedNodeId === node.id,
      },
    }));
  }, [nodes, edges, visibleIds, selectedNodeId]);

  const alertRules = useMemo(() => new Set(rules.map((r) => r.rule)), [rules]);

  const flowEdges = useMemo(() => {
    return buildFlowEdges(edges, alertRules, visibleIds).map((edge) => ({
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: (edge.style as { stroke?: string })?.stroke ?? "#5a9e4b",
      },
    }));
  }, [edges, alertRules, visibleIds]);

  const selectedNode = selectedNodeId
    ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
    : null;

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          Обнаруженные корреляции
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => {
                setSelectedAlertId(alert.id);
                setSelectedNodeId(`alert:${alert.id}`);
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                selectedAlertId === alert.id
                  ? "border-pistachio-500/40 bg-pistachio-500/10"
                  : "border-white/6 bg-white/2 hover:border-pistachio-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-zinc-100">{alert.name}</h3>
                <SeverityBadge severity={alert.severity} />
              </div>
              <p className="mt-1 font-mono text-xs text-pistachio-400">
                {alert.rule}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                <span>Confidence: {alert.confidence_score ?? "—"}%</span>
                <span>Сущностей: {alert.entity_count ?? "—"}</span>
                <span>{formatDate(alert.triggered_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedAlert && (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="glass-card overflow-hidden p-0 ring-1 ring-pistachio-500/10">
            <div className="border-b border-pistachio-500/10 bg-pistachio-500/5 px-6 py-4">
              <h2 className="text-xl font-bold text-zinc-50">
                Граф расследования
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {selectedAlert.name} · {flowNodes.length} узлов
              </p>
            </div>

            <div className="h-150 w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Загрузка графа...
                </div>
              ) : (
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  nodeTypes={nodeTypes}
                  onNodeClick={onNodeClick}
                  fitView
                  fitViewOptions={{ padding: 0.2, maxZoom: 1.4 }}
                  minZoom={0.2}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#3a4a36" gap={24} size={1.5} />
                  <Controls />
                </ReactFlow>
              )}
            </div>

            <div className="border-t border-white/6 px-6 py-4">
              <h3 className="text-sm font-semibold text-zinc-400">
                Временная шкала
              </h3>
              <InvestigationTimeline
                events={timelineEvents}
                alert={selectedAlert}
              />
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-zinc-100">
              Информация об объекте
            </h3>

            {selectedAlert && selectedNode?.group === "alert" && (
              <dl className="mt-4 space-y-2 text-sm">
                <Field label="Правило" value={selectedAlert.rule} />
                <Field label="Критичность" value={selectedAlert.severity} />
                <Field
                  label="Confidence Score"
                  value={`${selectedAlert.confidence_score ?? "—"}%`}
                />
                <Field label="Описание" value={selectedAlert.description} />
              </dl>
            )}

            {selectedNode && selectedNode.group !== "alert" && (
              <NodeInfoPanel node={selectedNode} events={timelineEvents} />
            )}

            {!selectedNode && selectedAlert && (
              <div className="mt-4 text-sm text-zinc-400">
                <p>{selectedAlert.description}</p>
                {selectedRule && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {selectedRule.condition}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
