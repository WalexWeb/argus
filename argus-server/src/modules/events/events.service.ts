import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  NormalizedEvent,
  StoredEvent,
} from '../../common/schemas/event.schema';

export interface PipelineStats {
  received: number;
  normalized: number;
  duplicates_removed: number;
  sent_to_correlation: number;
  alerts_created: number;
}

const EVENT_TYPE_SEVERITY: Record<string, string> = {
  intrusion_detected: 'high',
  login_failed: 'medium',
  login_success: 'low',
  file_access: 'medium',
  email_access: 'informational',
  email_rejected: 'medium',
  http_request: 'informational',
  vpn_error: 'low',
  syslog: 'informational',
};

const SOURCE_META: Record<
  string,
  { label: string; type: string; protocol: string; address: string }
> = {
  'active-directory': {
    label: 'Active Directory',
    type: 'Authentication',
    protocol: 'LDAP/Kerberos',
    address: 'ldap://dc01.corp.local:389',
  },
  'ids-ips': {
    label: 'IDS/IPS',
    type: 'Network Security',
    protocol: 'Syslog',
    address: '192.168.10.5:514',
  },
  'mail-gateway': {
    label: 'Mail Gateway',
    type: 'Mail Gateway',
    protocol: 'SMTP/IMAP',
    address: 'mail01.corp.local:25',
  },
  'web-server': {
    label: 'Web Server',
    type: 'Web Server',
    protocol: 'HTTP/HTTPS',
    address: '10.0.1.20:443',
  },
  firewall: {
    label: 'Firewall',
    type: 'Firewall',
    protocol: 'Syslog',
    address: '192.168.1.1:514',
  },
  vpn: {
    label: 'VPN',
    type: 'VPN',
    protocol: 'OpenVPN',
    address: 'vpn.corp.local:1194',
  },
  'linux-server': {
    label: 'Linux Server',
    type: 'System',
    protocol: 'Syslog',
    address: '10.0.2.15:514',
  },
  'windows-server': {
    label: 'Windows Server',
    type: 'System',
    protocol: 'WinEvent',
    address: 'win-srv01.corp.local',
  },
  syslog: {
    label: 'Syslog',
    type: 'System',
    protocol: 'Syslog',
    address: '0.0.0.0:514',
  },
};

@Injectable()
export class EventsService {
  private events: StoredEvent[] = [];
  private nextId = 1;
  private pipeline: PipelineStats = {
    received: 0,
    normalized: 0,
    duplicates_removed: 0,
    sent_to_correlation: 0,
    alerts_created: 0,
  };
  private hashAttempts = new Map<string, number>();

  getAll(): StoredEvent[] {
    return [...this.events].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  getById(id: number): StoredEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  count(): number {
    return this.events.length;
  }

  ingest(event: NormalizedEvent): StoredEvent | null {
    const attempts = (this.hashAttempts.get(event.hash) ?? 0) + 1;
    this.hashAttempts.set(event.hash, attempts);

    const duplicate = this.events.find((e) => e.hash === event.hash);
    if (duplicate) {
      return null;
    }

    const stored: StoredEvent = { ...event, id: this.nextId++ };
    this.events.push(stored);
    return stored;
  }

  ingestMany(events: NormalizedEvent[]): {
    ingested: StoredEvent[];
    duplicates: number;
  } {
    const ingested: StoredEvent[] = [];
    let duplicates = 0;

    this.pipeline.received += events.length;

    for (const event of events) {
      const result = this.ingest(event);
      if (result) {
        ingested.push(result);
      } else {
        duplicates++;
      }
    }

    this.pipeline.normalized += ingested.length;
    this.pipeline.duplicates_removed += duplicates;
    this.pipeline.sent_to_correlation += ingested.length;

    return { ingested, duplicates };
  }

  setAlertsCreated(count: number): void {
    this.pipeline.alerts_created = count;
  }

  getPipelineStats(): PipelineStats {
    return { ...this.pipeline };
  }

  getHashAttempts(hash: string): number {
    return this.hashAttempts.get(hash) ?? 1;
  }

  enrichEvent(event: StoredEvent) {
    const attempts = this.getHashAttempts(event.hash);
    return {
      ...event,
      severity: this.getEventSeverity(event),
      country:
        typeof event.details.country === 'string'
          ? event.details.country
          : null,
      description: this.getEventDescription(event),
      is_duplicate: false,
      duplicate_count: attempts,
      raw_log: this.getRawLog(event),
    };
  }

  private getEventDescription(event: StoredEvent): string {
    if (typeof event.details.signature === 'string') {
      return event.details.signature;
    }
    if (typeof event.details.reason === 'string') {
      return event.details.reason;
    }
    if (typeof event.details.action === 'string') {
      return event.details.action;
    }
    if (typeof event.details.path === 'string') {
      return String(event.details.path);
    }
    return event.event_type.replace(/_/g, ' ');
  }

  private getRawLog(event: StoredEvent): unknown {
    if (typeof event.details.raw_line === 'string') {
      return { format: 'syslog', raw: event.details.raw_line };
    }
    if (typeof event.details.raw_csv === 'string') {
      return { format: 'csv', raw: event.details.raw_csv };
    }
    return {
      format: 'json',
      source: event.source,
      data: {
        timestamp: event.timestamp,
        event_type: event.event_type,
        ip: event.ip,
        username: event.username,
        ...event.details,
      },
    };
  }

  getEventSeverity(event: StoredEvent): string {
    const fromDetails = event.details.severity;
    if (typeof fromDetails === 'string') {
      return fromDetails;
    }
    return EVENT_TYPE_SEVERITY[event.event_type] ?? 'informational';
  }

  getEventsBySeverity(): { severity: string; count: number }[] {
    const order = ['critical', 'high', 'medium', 'low', 'informational'];
    const map = new Map<string, number>();

    for (const event of this.events) {
      const severity = this.getEventSeverity(event);
      map.set(severity, (map.get(severity) ?? 0) + 1);
    }

    return order
      .filter((s) => map.has(s))
      .map((severity) => ({ severity, count: map.get(severity)! }));
  }

  getUniqueSourcesCount(): number {
    return new Set(this.events.map((e) => e.source)).size;
  }

  getTimelineForRange(
    range: 'hour' | 'day' | 'week',
  ): { hour: string; count: number }[] {
    if (this.events.length === 0) {
      return [];
    }

    const now = Date.now();
    const rangeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[range];

    const from = now - rangeMs;
    const filtered = this.events.filter(
      (e) => new Date(e.timestamp).getTime() >= from,
    );

    const bucketMs = {
      hour: 5 * 60 * 1000,
      day: 60 * 60 * 1000,
      week: 24 * 60 * 60 * 1000,
    }[range];

    const map = new Map<string, number>();

    for (const event of filtered) {
      const ts = new Date(event.timestamp).getTime();
      const bucketStart = Math.floor(ts / bucketMs) * bucketMs;
      const key = new Date(bucketStart).toISOString();
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const sortedKeys = [...map.keys()].sort();
    if (sortedKeys.length === 0) {
      return [];
    }

    const first = new Date(sortedKeys[0]).getTime();
    const last = new Date(sortedKeys[sortedKeys.length - 1]).getTime();
    const result: { hour: string; count: number }[] = [];

    for (let cursor = first; cursor <= last; cursor += bucketMs) {
      const key = new Date(cursor).toISOString();
      result.push({ hour: key, count: map.get(key) ?? 0 });
    }

    return result;
  }

  getSources() {
    const map = new Map<
      string,
      { events: StoredEvent[]; lastEvent: StoredEvent | null }
    >();

    for (const event of this.events) {
      const entry = map.get(event.source) ?? { events: [], lastEvent: null };
      entry.events.push(event);
      if (
        !entry.lastEvent ||
        new Date(event.timestamp) > new Date(entry.lastEvent.timestamp)
      ) {
        entry.lastEvent = event;
      }
      map.set(event.source, entry);
    }

    const totalEvents = this.events.length;

    return [...map.entries()].map(([source, data]) => {
      const meta = SOURCE_META[source] ?? {
        label: source,
        type: 'Unknown',
        protocol: 'Unknown',
        address: '—',
      };

      const sorted = [...data.events].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const hourAgo = Date.now() - 60 * 60 * 1000;
      const recentCount = data.events.filter(
        (e) => new Date(e.timestamp).getTime() >= hourAgo,
      ).length;

      return {
        id: source,
        name: meta.label,
        type: meta.type,
        protocol: meta.protocol,
        status: data.events.length > 0 ? 'connected' : 'disconnected',
        connection_address: meta.address,
        events_count: data.events.length,
        share_percent:
          totalEvents > 0
            ? Math.round((data.events.length / totalEvents) * 1000) / 10
            : 0,
        last_event_at: data.lastEvent?.timestamp ?? null,
        last_sync_at: sorted[0]?.timestamp ?? new Date().toISOString(),
        error_count: data.events.filter(
          (e) =>
            e.event_type.includes('failed') ||
            e.event_type.includes('error') ||
            e.event_type.includes('rejected'),
        ).length,
        events_per_hour: recentCount,
        timeline: this.getSourceTimeline(source),
      };
    });
  }

  private getSourceTimeline(source: string): { hour: string; count: number }[] {
    const sourceEvents = this.events.filter((e) => e.source === source);
    const map = new Map<string, number>();

    for (const event of sourceEvents) {
      const date = new Date(event.timestamp);
      date.setUTCMinutes(0, 0, 0);
      const key = date.toISOString().slice(0, 13) + ':00';
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));
  }

  getEventsInWindow(from: Date, to: Date): StoredEvent[] {
    return this.events.filter((e) => {
      const ts = new Date(e.timestamp);
      return ts >= from && ts <= to;
    });
  }

  getTopSources(limit = 5): { source: string; count: number }[] {
    const map = new Map<string, number>();
    for (const e of this.events) {
      map.set(e.source, (map.get(e.source) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getTopIps(limit = 5): { ip: string; count: number }[] {
    const map = new Map<string, number>();
    for (const e of this.events) {
      if (e.ip) {
        map.set(e.ip, (map.get(e.ip) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getEventsByType(): { event_type: string; count: number }[] {
    const map = new Map<string, number>();
    for (const e of this.events) {
      map.set(e.event_type, (map.get(e.event_type) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count);
  }

  getTimeline(): { hour: string; count: number }[] {
    if (this.events.length === 0) {
      return [];
    }

    const map = new Map<string, number>();

    for (const event of this.events) {
      const date = new Date(event.timestamp);

      // Используем UTC, чтобы не было сдвига часовых поясов
      date.setUTCMinutes(0, 0, 0);

      const key = date.toISOString().slice(0, 13) + ':00';

      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const first = new Date([...map.keys()].sort()[0] + ':00.000Z');

    const last = new Date([...map.keys()].sort().at(-1)! + ':00.000Z');

    const result: { hour: string; count: number }[] = [];

    const cursor = new Date(first);

    while (cursor <= last) {
      const key = cursor.toISOString().slice(0, 13) + ':00';

      result.push({
        hour: key,
        count: map.get(key) ?? 0,
      });

      cursor.setUTCHours(cursor.getUTCHours() + 1);
    }
    return result;
  }

  clear(): void {
    this.events = [];
    this.nextId = 1;
    this.pipeline = {
      received: 0,
      normalized: 0,
      duplicates_removed: 0,
      sent_to_correlation: 0,
      alerts_created: 0,
    };
    this.hashAttempts.clear();
  }
}

export function computeEventHash(event: Omit<NormalizedEvent, 'hash'>): string {
  const payload = JSON.stringify({
    source: event.source,
    event_type: event.event_type,
    ip: event.ip,
    username: event.username,
    timestamp: event.timestamp,
    details: event.details,
  });
  return createHash('sha256').update(payload).digest('hex');
}
