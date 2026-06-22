import dagre from '@dagrejs/dagre';
import type { GraphEdge, GraphNode } from '@/lib/api';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { GROUP_LABELS } from './constants';

const GROUP_RANK: Record<string, number> = {
  source: 0,
  ip: 1,
  user: 2,
  alert: 3,
};

const NODE_WIDTH = 250;
const NODE_HEIGHT = 92;

function getRank(nodeId: string, nodeMap: Map<string, GraphNode>): number {
  const node = nodeMap.get(nodeId);
  return node ? (GROUP_RANK[node.group] ?? 1) : 1;
}

export function layoutGraphNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  visibleIds?: Set<string>,
): Node[] {
  const activeNodes = visibleIds
    ? nodes.filter((n) => visibleIds.has(n.id))
    : nodes;

  if (activeNodes.length === 0) return [];

  const nodeMap = new Map(activeNodes.map((n) => [n.id, n]));
  const activeIds = new Set(activeNodes.map((n) => n.id));

  const activeEdges = edges.filter(
    (e) => activeIds.has(e.from) && activeIds.has(e.to),
  );

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    align: 'UL',
    nodesep: 110,
    ranksep: 260,
    edgesep: 80,
    marginx: 60,
    marginy: 60,
  });

  for (const node of activeNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edgeKeys = new Set<string>();

  for (const edge of activeEdges) {
    let from = edge.from;
    let to = edge.to;
    const fromRank = getRank(from, nodeMap);
    const toRank = getRank(to, nodeMap);

    if (fromRank > toRank) {
      [from, to] = [to, from];
    }

    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);

    const minlen = Math.max(1, Math.abs(getRank(to, nodeMap) - getRank(from, nodeMap)));

    try {
      g.setEdge(from, to, { minlen, weight: fromRank === toRank ? 0 : 2 });
    } catch {
      // parallel edge — skip duplicate
    }
  }

  dagre.layout(g);

  return activeNodes.map((node, index) => {
    const pos = g.node(node.id);
    const rank = GROUP_RANK[node.group] ?? 1;
    const fallbackX = rank * 320 + 60;
    const fallbackY = index * 110 + 60;

    return {
      id: node.id,
      type: node.group,
      position: {
        x: (pos?.x ?? fallbackX) - NODE_WIDTH / 2,
        y: (pos?.y ?? fallbackY) - NODE_HEIGHT / 2,
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
