import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  NormalizedEvent,
  StoredEvent,
} from '../../common/schemas/event.schema';

@Injectable()
export class EventsService {
  private events: StoredEvent[] = [];
  private nextId = 1;

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

    for (const event of events) {
      const result = this.ingest(event);
      if (result) {
        ingested.push(result);
      } else {
        duplicates++;
      }
    }

    return { ingested, duplicates };
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
