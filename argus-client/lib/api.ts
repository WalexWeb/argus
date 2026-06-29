const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface PipelineStats {
  received: number;
  normalized: number;
  duplicates_removed: number;
  sent_to_correlation: number;
  alerts_created: number;
}

export interface Summary {
  system: string;
  full_name: string;
  events_total: number;
  events_unique: number;
  duplicates_removed: number;
  alerts_total: number;
  alerts_active: number;
  sources_connected: number;
  correlation_rules_active: number;
  avg_processing_time_ms: number;
  alerts_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  events_by_severity: { severity: string; count: number }[];
  top_sources: { source: string; count: number }[];
  top_ips: { ip: string; count: number }[];
  events_by_type: { event_type: string; count: number }[];
  timeline: { hour: string; count: number }[];
  timeline_hour: { hour: string; count: number }[];
  timeline_day: { hour: string; count: number }[];
  timeline_week: { hour: string; count: number }[];
  pipeline: PipelineStats;
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
  severity?: string;
  country?: string | null;
  description?: string;
  is_duplicate?: boolean;
  duplicate_count?: number;
  raw_log?: unknown;
}

export type AlertStatus = "open" | "investigating" | "closed" | "false_positive";

export interface Alert {
  id: number;
  rule: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  triggered_at: string;
  related_events: number[];
  evidence: Record<string, unknown>;
  status?: AlertStatus;
  entity_count?: number;
  confidence_score?: number;
  risk_score?: number;
}

export interface CorrelationRule {
  rule: string;
  name: string;
  description: string;
  condition: string;
  severity: string;
  action: string;
}

export interface SourceInfo {
  id: string;
  name: string;
  type: string;
  protocol: string;
  status: "connected" | "disconnected";
  connection_address: string;
  events_count: number;
  share_percent: number;
  last_event_at: string | null;
  last_sync_at: string;
  error_count: number;
  events_per_hour: number;
  timeline: { hour: string; count: number }[];
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

export async function getSources(): Promise<{
  total: number;
  sources: SourceInfo[];
}> {
  return fetchApi("/api/v1/sources");
}

export async function getAlertTimeline(id: number): Promise<{
  alert: Alert;
  events: SecurityEvent[];
}> {
  return fetchApi(`/api/v1/alerts/${id}/timeline`);
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

export async function getCorrelationGraph(
  alertId?: number,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const query = alertId ? `?alertId=${alertId}` : "";
  return fetchApi(`/api/v1/correlation-graph${query}`);
}
