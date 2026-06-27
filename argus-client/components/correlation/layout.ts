import type { GraphEdge, GraphNode } from "@/lib/api";
import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { GROUP_LABELS } from "./constants";

const GROUP_COLUMN_X: Record<string, number> = {
  source: 120,
  ip: 420,
  user: 720,
  evidence: 1020,
  alert: 1320,
};

const GROUP_ORDER = ["source", "ip", "user", "evidence", "alert"] as const;

const NODE_WIDTH = 250;
const ROW_HEIGHT = 120;

export function layoutGraphNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  visibleIds?: Set<string>,
): Node[] {
  const activeNodes = visibleIds
    ? nodes.filter((n) => visibleIds.has(n.id))
    : nodes;

  if (!activeNodes.length) {
    return [];
  }

  const grouped: Record<string, GraphNode[]> = {
    source: [],
    ip: [],
    user: [],
    evidence: [],
    alert: [],
  };

  for (const node of activeNodes) {
    grouped[node.group]?.push(node);
  }

  const positions = new Map<string, { x: number; y: number }>();

  GROUP_ORDER.forEach((group) => {
    grouped[group].sort((a, b) => a.label.localeCompare(b.label));

    grouped[group].forEach((node, index) => {
      positions.set(node.id, {
        x: GROUP_COLUMN_X[group] - NODE_WIDTH / 2,
        y: 80 + index * ROW_HEIGHT,
      });
    });
  });

  return activeNodes.map((node) => ({
    id: node.id,
    type: node.group,
    position: positions.get(node.id)!,
    data: {
      label: node.label,
      group: GROUP_LABELS[node.group] ?? node.group,
    },
  }));
}

export function getConnectedNodeIds(
  alertNodeId: string,
  edges: { from: string; to: string }[],
): Set<string> {
  const connected = new Set<string>([alertNodeId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const edge of edges) {
      if (connected.has(edge.from) && !connected.has(edge.to)) {
        connected.add(edge.to);
        changed = true;
      }
      if (connected.has(edge.to) && !connected.has(edge.from)) {
        connected.add(edge.from);
        changed = true;
      }
    }
  }

  return connected;
}

export function getRuleNodeIds(
  rule: string,
  edges: { from: string; to: string; label: string }[],
): Set<string> {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.label === rule) {
      ids.add(edge.from);
      ids.add(edge.to);
    }
  }
  return ids;
}

export function buildFlowEdges(
  edges: GraphEdge[],
  alertRules: Set<string>,
  visibleIds: Set<string>,
  nodeIdMapper?: (id: string) => string,
): Edge[] {
  const mapId = nodeIdMapper ?? ((id: string) => id);

  return edges
    .filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to))
    .map((edge, index) => {
      const isAlert = alertRules.has(edge.label);

      return {
        id: `edge-${index}-${edge.from}-${edge.to}`,
        source: mapId(edge.from),
        target: mapId(edge.to),
        label: isAlert ? edge.label : undefined,
        type: "smoothstep",
        animated: isAlert,
        style: {
          stroke: isAlert ? "#f87171" : "#5a9e4b",
          strokeWidth: isAlert ? 2.5 : 1.2,
        },
        labelStyle: {
          fill: "#fca5a5",
          fontSize: 12,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: "#0a0c0a",
          fillOpacity: 0.95,
        },
        labelBgPadding: [8, 5] as [number, number],
        labelBgBorderRadius: 8,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAlert ? "#f87171" : "#5a9e4b",
        },
      };
    });
}

export function clusterEdgeMapper(
  clusterAlertId: number,
  originalId: string,
): string {
  return `${originalId}@a${clusterAlertId}`;
}
