import type { GraphEdge, GraphNode } from '@/lib/api';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { GROUP_LABELS } from './constants';

const GROUP_COLUMN_X: Record<string, number> = {
  source: 80,
  ip: 420,
  user: 760,
  alert: 1100,
};

const NODE_WIDTH = 250;
const GROUP_ORDER: Array<keyof typeof GROUP_COLUMN_X> = [
  'source',
  'ip',
  'user',
  'alert',
];

export function layoutGraphNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  visibleIds?: Set<string>,
): Node[] {
  const activeNodes = visibleIds
    ? nodes.filter((n) => visibleIds.has(n.id))
    : nodes;

  if (activeNodes.length === 0) return [];

  const grouped: Record<
    keyof typeof GROUP_COLUMN_X,
    GraphNode[]
  > = {
    source: [],
    ip: [],
    user: [],
    alert: [],
  };

  for (const node of activeNodes) {
    grouped[node.group as keyof typeof grouped]?.push(node);
  }

  for (const group of GROUP_ORDER) {
    grouped[group].sort((a, b) => a.label.localeCompare(b.label));
  }

  const rowGap = 110;
  const groupPositions = new Map<string, { x: number; y: number }>();

  for (const group of GROUP_ORDER) {
    const x = GROUP_COLUMN_X[group] - NODE_WIDTH / 2;
    for (let index = 0; index < grouped[group].length; index += 1) {
      const node = grouped[group][index];
      groupPositions.set(node.id, {
        x,
        y: 60 + index * rowGap,
      });
    }
  }

  return activeNodes.map((node) => {
    const pos = groupPositions.get(node.id);

    return {
      id: node.id,
      type: node.group,
      position: {
        x: pos?.x ?? GROUP_COLUMN_X[node.group] - NODE_WIDTH / 2,
        y: pos?.y ?? 60,
      },
      data: {
        label: node.label,
        group: GROUP_LABELS[node.group] ?? node.group,
      },
    };
  });
}

export function layoutAlertClusters(
  nodes: GraphNode[],
  edges: GraphEdge[],
  alerts: { id: number }[],
): Node[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const clusters: { alertId: number; nodeIds: Set<string> }[] = [];

  for (const alert of alerts) {
    const alertNodeId = `alert:${alert.id}`;
    if (!nodeMap.has(alertNodeId)) continue;

    const nodeIds = getConnectedNodeIds(alertNodeId, edges);
    clusters.push({ alertId: alert.id, nodeIds });
  }

  if (clusters.length === 0) {
    return layoutGraphNodes(nodes, edges);
  }

  const COLS = 2;
  const CLUSTER_W = 1500;
  const CLUSTER_H = 700;
  const allNodes: Node[] = [];

  clusters.forEach((cluster, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const offsetX = col * CLUSTER_W + 40;
    const offsetY = row * CLUSTER_H + 40;

    const clusterNodes = layoutGraphNodes(nodes, edges, cluster.nodeIds);

    for (const node of clusterNodes) {
      allNodes.push({
        ...node,
        id: `${node.id}@a${cluster.alertId}`,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
        data: {
          ...node.data,
          originalId: node.id,
          clusterAlertId: cluster.alertId,
        },
      });
    }
  });

  return allNodes;
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
        type: 'smoothstep',
        animated: isAlert,
        style: {
          stroke: isAlert ? '#f87171' : '#5a9e4b',
          strokeWidth: isAlert ? 2.5 : 1.2,
        },
        labelStyle: {
          fill: '#fca5a5',
          fontSize: 12,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#0a0c0a',
          fillOpacity: 0.95,
        },
        labelBgPadding: [8, 5] as [number, number],
        labelBgBorderRadius: 8,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAlert ? '#f87171' : '#5a9e4b',
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
