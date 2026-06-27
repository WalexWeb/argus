const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface Summary {
  system: string;
  full_name: string;
  events_total: number;
  alerts_total: number;
  alerts_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  top_sources: { source: string; count: number }[];
  top_ips: { ip: string; count: number }[];
  events_by_type: { event_type: string; count: number }[];
  timeline: { hour: string; count: number }[];
  recent_alerts: Alert[];
  recent_events: SecurityEvent[];
}

export interface SecurityEvent {
  id: number;
  source: string;
  event_type: string;
  ip: string | null;
  username: string | null;
  timestamp: string;
  details: Record<string, unknown>;
  hash: string;
}

export interface Alert {
  id: number;
  rule: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  triggered_at: string;
  related_events: number[];
  evidence: Record<string, unknown>;
}

export interface CorrelationRule {
  rule: string;
  name: string;
  description: string;
  condition: string;
  severity: string;
  action: string;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getSummary(): Promise<Summary> {
  return fetchApi("/api/v1/summary");
}

export async function getAlerts(): Promise<{ total: number; alerts: Alert[] }> {
  return fetchApi("/api/v1/alerts");
}

export async function getEvents(): Promise<{
  total: number;
  events: SecurityEvent[];
}> {
  return fetchApi("/api/v1/events");
}

export async function getRules(): Promise<{ rules: CorrelationRule[] }> {
  return fetchApi("/api/v1/rules");
}

export async function reloadMockLogs(): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/v1/ingest/mock`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export async function getCorrelationGraph(): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  return fetchApi("/api/v1/correlation-graph");
}
