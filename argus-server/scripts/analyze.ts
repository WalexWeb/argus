/**
 * CLI-утилита АРГУС: загрузка моковых логов и вывод результатов корреляции.
 * Запуск: npm run analyze
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

interface NormalizedEvent {
  source: string;
  event_type: string;
  ip: string | null;
  username: string | null;
  timestamp: string;
  details: Record<string, unknown>;
  hash: string;
}

interface StoredEvent extends NormalizedEvent {
  id: number;
}

function computeHash(event: Omit<NormalizedEvent, 'hash'>): string {
  return createHash('sha256').update(JSON.stringify(event)).digest('hex');
}

function parseJsonLog(
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
  const username = typeof data.username === 'string' ? data.username : null;
  const partial = {
    source,
    event_type,
    ip,
    username,
    timestamp,
    details: { ...data },
  };
  return { ...partial, hash: computeHash(partial) };
}

function parseSyslog(raw: string): NormalizedEvent {
  const ipMatch = raw.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  let source = 'syslog';
  let event_type = 'syslog';
  if (raw.includes('suricata')) {
    source = 'ids-ips';
    event_type = 'intrusion_detected';
  } else if (raw.includes('postfix')) {
    source = 'mail-gateway';
    event_type = 'email_rejected';
  }
  const partial = {
    source,
    event_type,
    ip: ipMatch?.[1] ?? null,
    username: null,
    timestamp: new Date().toISOString(),
    details: { raw_line: raw },
  };
  return { ...partial, hash: computeHash(partial) };
}

function main() {
  const dataDir = join(process.cwd(), 'data');
  const logsFile = JSON.parse(
    readFileSync(join(dataDir, 'mock-logs.json'), 'utf-8'),
  );
  const rulesFile = JSON.parse(
    readFileSync(join(dataDir, 'correlation-rules.json'), 'utf-8'),
  );

  const events: StoredEvent[] = [];
  let id = 1;
  const seen = new Set<string>();

  for (const raw of logsFile.logs) {
    let normalized: NormalizedEvent | null = null;

    if (raw.format === 'json') {
      normalized = parseJsonLog(raw.source, raw.data);
    } else if (raw.format === 'syslog') {
      normalized = parseSyslog(raw.raw);
    }

    if (normalized && !seen.has(normalized.hash)) {
      seen.add(normalized.hash);
      events.push({ ...normalized, id: id++ });
    }
  }

  const alerts: {
    severity: string;
    name: string;
    rule: string;
    description: string;
    evidence: Record<string, unknown>;
  }[] = [];

  for (const rule of rulesFile) {
    if (rule.rule === 'MULTIPLE_USERS_SAME_IP') {
      const byIp = new Map<string, StoredEvent[]>();
      for (const e of events.filter((e) => e.event_type === 'login_failed')) {
        if (!e.ip) continue;
        const list = byIp.get(e.ip) ?? [];
        list.push(e);
        byIp.set(e.ip, list);
      }
      for (const [ip, ipEvents] of byIp) {
        const users = new Set(ipEvents.map((e) => e.username));
        if (users.size > 10) {
          alerts.push({
            rule: rule.rule,
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            evidence: { ip, user_count: users.size },
          });
        }
      }
    }

    if (rule.rule === 'EMAIL_MULTIPLE_COUNTRIES') {
      const byEmail = new Map<string, StoredEvent[]>();
      for (const e of events.filter((e) => e.event_type === 'email_access')) {
        if (!e.username) continue;
        const list = byEmail.get(e.username) ?? [];
        list.push(e);
        byEmail.set(e.username, list);
      }
      for (const [email, emailEvents] of byEmail) {
        const countries = new Set(
          emailEvents.map((e) => e.details.country as string),
        );
        if (countries.size >= 3) {
          alerts.push({
            rule: rule.rule,
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            evidence: { email, countries: [...countries] },
          });
        }
      }
    }

    if (rule.rule === 'ACCOUNT_COMPROMISE_CHAIN') {
      for (const e of events.filter((ev) => ev.username === 'admin')) {
        void e;
      }
      const adminEvents = events
        .filter((e) => e.username === 'admin')
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      const failed = adminEvents.filter((e) => e.event_type === 'login_failed');
      const success = adminEvents.find((e) => e.event_type === 'login_success');
      const fileAccess = adminEvents.find(
        (e) =>
          e.event_type === 'file_access' &&
          e.details.classification === 'confidential',
      );
      if (failed.length >= 3 && success && fileAccess) {
        alerts.push({
          rule: rule.rule,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          evidence: {
            username: 'admin',
            failed_attempts: failed.length,
            resource: fileAccess.details.resource,
          },
        });
      }
    }

    if (rule.rule === 'IDS_HIGH_SEVERITY') {
      for (const e of events.filter(
        (ev) =>
          ev.event_type === 'intrusion_detected' &&
          ev.details.severity === 'high',
      )) {
        alerts.push({
          rule: rule.rule,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          evidence: { signature: e.details.signature, ip: e.ip },
        });
      }
    }
  }

  for (const alert of alerts) {
    console.log(
      `[${alert.severity.toUpperCase()}] ${alert.name} (${alert.rule})`,
    );
  }
}

main();
