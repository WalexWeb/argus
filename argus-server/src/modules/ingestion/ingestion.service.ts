import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  IngestEventDto,
  MockLogsFileSchema,
  NormalizedEvent,
  RawLogSchema,
} from '../../common/schemas/event.schema';
import { computeEventHash, EventsService } from '../events/events.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(private readonly eventsService: EventsService) {}

  loadMockLogs(filePath?: string): {
    ingested: number;
    duplicates: number;
    total: number;
  } {
    const path =
      filePath ?? join(process.cwd(), 'data', 'mock-logs.json');

    this.logger.log(`Загрузка моковых логов из ${path}`);

    const raw = readFileSync(path, 'utf-8');
    const parsed = MockLogsFileSchema.parse(JSON.parse(raw));

    const normalized = parsed.logs
      .map((log) => this.parseRawLog(log))
      .filter((e): e is NormalizedEvent => e !== null);

    const result = this.eventsService.ingestMany(normalized);

    this.logger.log(
      `Загружено: ${result.ingested.length}, дубликатов: ${result.duplicates}`,
    );

    return {
      ingested: result.ingested.length,
      duplicates: result.duplicates,
      total: parsed.logs.length,
    };
  }

  ingestDto(dto: IngestEventDto): NormalizedEvent {
    const timestamp = dto.timestamp ?? new Date().toISOString();
    const partial: Omit<NormalizedEvent, 'hash'> = {
      source: dto.source,
      event_type: dto.event_type,
      ip: dto.ip ?? null,
      username: dto.username ?? null,
      timestamp,
      details: dto.details ?? {},
    };
    return { ...partial, hash: computeEventHash(partial) };
  }

  private parseRawLog(raw: unknown): NormalizedEvent | null {
    const log = RawLogSchema.parse(raw);

    switch (log.format) {
      case 'json':
        return this.parseJsonLog(log.source, log.data);
      case 'syslog':
        return this.parseSyslog(log.raw);
      case 'csv':
        return this.parseCsvLog(log.source, log.data);
      default:
        return null;
    }
  }

  private parseJsonLog(
    source: string,
    data: Record<string, unknown>,
  ): NormalizedEvent {
    const timestamp =
      typeof data.timestamp === 'string'
        ? new Date(data.timestamp).toISOString()
        : new Date().toISOString();

    const event_type =
      typeof data.event_type === 'string' ? data.event_type : 'unknown';

    const ip =
      typeof data.ip === 'string'
        ? data.ip
        : typeof data.src_ip === 'string'
          ? data.src_ip
          : null;

    const username =
      typeof data.username === 'string' ? data.username : null;

    const details = { ...data };
    delete details.timestamp;
    delete details.event_type;
    delete details.ip;
    delete details.src_ip;
    delete details.username;

    const partial: Omit<NormalizedEvent, 'hash'> = {
      source,
      event_type,
      ip,
      username,
      timestamp,
      details,
    };

    return { ...partial, hash: computeEventHash(partial) };
  }

  private parseSyslog(raw: string): NormalizedEvent {
    const ipMatch = raw.match(
      /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/,
    );
    const ip = ipMatch?.[1] ?? null;

    let event_type = 'syslog';
    let source = 'syslog';

    if (raw.includes('suricata') || raw.includes('ET ')) {
      source = 'ids-ips';
      event_type = 'intrusion_detected';
    } else if (raw.includes('postfix')) {
      source = 'mail-gateway';
      event_type = 'email_rejected';
    } else if (raw.includes('openvpn')) {
      source = 'vpn';
      event_type = 'vpn_error';
    }

    const timestamp = this.extractSyslogTimestamp(raw);

    const partial: Omit<NormalizedEvent, 'hash'> = {
      source,
      event_type,
      ip,
      username: null,
      timestamp,
      details: { raw_line: raw },
    };

    return { ...partial, hash: computeEventHash(partial) };
  }

  private parseCsvLog(source: string, data: string): NormalizedEvent {
    const parts = data.split(',');
    const [timestampRaw, event_type, ...rest] = parts;

    const timestamp = timestampRaw
      ? new Date(timestampRaw).toISOString()
      : new Date().toISOString();

    const partial: Omit<NormalizedEvent, 'hash'> = {
      source,
      event_type: event_type ?? 'csv_event',
      ip: null,
      username: rest[1]?.trim() ?? null,
      timestamp,
      details: {
        raw_csv: data,
        fields: rest,
      },
    };

    return { ...partial, hash: computeEventHash(partial) };
  }

  private extractSyslogTimestamp(raw: string): string {
    const match = raw.match(
      /([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/,
    );
    if (match) {
      const parsed = new Date(`${match[1]} 2026`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  }
}
