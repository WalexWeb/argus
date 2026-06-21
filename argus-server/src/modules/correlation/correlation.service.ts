import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  Alert,
  CorrelationRule,
  CorrelationRuleSchema,
} from '../../common/schemas/event.schema';
import { StoredEvent } from '../../common/schemas/event.schema';
import { EventsService } from '../events/events.service';

@Injectable()
export class AlertsService {
  private alerts: Alert[] = [];
  private nextId = 1;

  create(alert: Omit<Alert, 'id'>): Alert {
    const stored: Alert = { ...alert, id: this.nextId++ };
    this.alerts.push(stored);
    return stored;
  }

  getAll(): Alert[] {
    return [...this.alerts].sort(
      (a, b) =>
        new Date(b.triggered_at).getTime() -
        new Date(a.triggered_at).getTime(),
    );
  }

  getBySeverity(severity: string): Alert[] {
    return this.getAll().filter((a) => a.severity === severity);
  }

  count(): number {
    return this.alerts.length;
  }

  clear(): void {
    this.alerts = [];
    this.nextId = 1;
  }
}

@Injectable()
export class CorrelationService {
  private readonly logger = new Logger(CorrelationService.name);
  private rules: CorrelationRule[] = [];

  constructor(
    private readonly eventsService: EventsService,
    private readonly alertsService: AlertsService,
  ) {
    this.loadRules();
  }

  loadRules(filePath?: string): void {
    const path =
      filePath ?? join(process.cwd(), 'data', 'correlation-rules.json');
    const raw = readFileSync(path, 'utf-8');
    this.rules = JSON.parse(raw).map((r: unknown) =>
      CorrelationRuleSchema.parse(r),
    );
    this.logger.log(`Загружено ${this.rules.length} правил корреляции`);
  }

  getRules(): CorrelationRule[] {
    return this.rules;
  }

  runCorrelation(): Alert[] {
    this.alertsService.clear();
    const events = this.eventsService.getAll();
    const newAlerts: Alert[] = [];

    for (const rule of this.rules) {
      const matches = this.evaluateRule(rule, events);
      for (const match of matches) {
        const alert = this.alertsService.create({
          rule: rule.rule,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          triggered_at: new Date().toISOString(),
          related_events: match.eventIds,
          evidence: match.evidence,
        });
        newAlerts.push(alert);
        this.logger.warn(
          `Алерт: [${rule.severity.toUpperCase()}] ${rule.name}`,
        );
      }
    }

    return newAlerts;
  }

  private evaluateRule(
    rule: CorrelationRule,
    events: StoredEvent[],
  ): { eventIds: number[]; evidence: Record<string, unknown> }[] {
    switch (rule.rule) {
      case 'MULTIPLE_USERS_SAME_IP':
        return this.checkMultipleUsersSameIp(events);
      case 'EMAIL_MULTIPLE_COUNTRIES':
        return this.checkEmailMultipleCountries(events);
      case 'ACCOUNT_COMPROMISE_CHAIN':
        return this.checkAccountCompromiseChain(events);
      case 'IDS_HIGH_SEVERITY':
        return this.checkIdsHighSeverity(events);
      default:
        return [];
    }
  }

  private checkMultipleUsersSameIp(
    events: StoredEvent[],
  ): { eventIds: number[]; evidence: Record<string, unknown> }[] {
    const loginEvents = events.filter(
      (e) => e.event_type === 'login_failed' && e.ip && e.username,
    );

    const byIp = new Map<string, StoredEvent[]>();
    for (const e of loginEvents) {
      const list = byIp.get(e.ip!) ?? [];
      list.push(e);
      byIp.set(e.ip!, list);
    }

    const results: { eventIds: number[]; evidence: Record<string, unknown> }[] =
      [];

    for (const [ip, ipEvents] of byIp) {
      const sorted = ipEvents.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const windowMs = 10 * 60 * 1000;
      let start = 0;

      for (let end = 0; end < sorted.length; end++) {
        while (
          new Date(sorted[end].timestamp).getTime() -
            new Date(sorted[start].timestamp).getTime() >
          windowMs
        ) {
          start++;
        }

        const usersInWindow = new Set(
          sorted.slice(start, end + 1).map((e) => e.username),
        );

        if (usersInWindow.size > 10) {
          const windowEvents = sorted.slice(start, end + 1);
          results.push({
            eventIds: windowEvents.map((e) => e.id),
            evidence: {
              ip,
              unique_users: [...usersInWindow],
              user_count: usersInWindow.size,
              time_window: '10m',
            },
          });
          break;
        }
      }
    }

    return results;
  }

  private checkEmailMultipleCountries(
    events: StoredEvent[],
  ): { eventIds: number[]; evidence: Record<string, unknown> }[] {
    const emailEvents = events.filter(
      (e) =>
        e.event_type === 'email_access' &&
        e.username &&
        e.details.country,
    );

    const byEmail = new Map<string, StoredEvent[]>();
    for (const e of emailEvents) {
      const list = byEmail.get(e.username!) ?? [];
      list.push(e);
      byEmail.set(e.username!, list);
    }

    const results: { eventIds: number[]; evidence: Record<string, unknown> }[] =
      [];

    for (const [email, emailEventsList] of byEmail) {
      const countries = new Set(
        emailEventsList.map((e) => e.details.country as string),
      );

      if (countries.size >= 3) {
        results.push({
          eventIds: emailEventsList.map((e) => e.id),
          evidence: {
            email,
            countries: [...countries],
            ips: emailEventsList.map((e) => ({
              ip: e.ip,
              country: e.details.country,
              timestamp: e.timestamp,
            })),
          },
        });
      }
    }

    return results;
  }

  private checkAccountCompromiseChain(
    events: StoredEvent[],
  ): { eventIds: number[]; evidence: Record<string, unknown> }[] {
    const results: { eventIds: number[]; evidence: Record<string, unknown> }[] =
      [];

    const byUser = new Map<string, StoredEvent[]>();
    for (const e of events) {
      if (!e.username) continue;
      const list = byUser.get(e.username) ?? [];
      list.push(e);
      byUser.set(e.username, list);
    }

    for (const [username, userEvents] of byUser) {
      const sorted = userEvents.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const windowMs = 15 * 60 * 1000;

      for (let i = 0; i < sorted.length; i++) {
        const chainStart = new Date(sorted[i].timestamp);
        const windowEvents = sorted.filter((e) => {
          const ts = new Date(e.timestamp).getTime();
          return (
            ts >= chainStart.getTime() &&
            ts <= chainStart.getTime() + windowMs
          );
        });

        const failedLogins = windowEvents.filter(
          (e) => e.event_type === 'login_failed',
        );
        const successLogin = windowEvents.find(
          (e) => e.event_type === 'login_success',
        );
        const confidentialAccess = windowEvents.find(
          (e) =>
            e.event_type === 'file_access' &&
            e.details.classification === 'confidential',
        );

        if (
          failedLogins.length >= 3 &&
          successLogin &&
          confidentialAccess &&
          new Date(successLogin.timestamp) >
            new Date(failedLogins[failedLogins.length - 1].timestamp)
        ) {
          const chainIds = [
            ...failedLogins.map((e) => e.id),
            successLogin.id,
            confidentialAccess.id,
          ];

          results.push({
            eventIds: chainIds,
            evidence: {
              username,
              failed_attempts: failedLogins.length,
              success_at: successLogin.timestamp,
              accessed_resource: confidentialAccess.details.resource,
              ip: successLogin.ip,
            },
          });
          break;
        }
      }
    }

    return results;
  }

  private checkIdsHighSeverity(
    events: StoredEvent[],
  ): { eventIds: number[]; evidence: Record<string, unknown> }[] {
    const matches = events.filter(
      (e) =>
        e.event_type === 'intrusion_detected' &&
        e.details.severity === 'high',
    );

    return matches.map((e) => ({
      eventIds: [e.id],
      evidence: {
        signature: e.details.signature,
        src_ip: e.ip,
        dst_ip: e.details.dst_ip,
        severity: e.details.severity,
      },
    }));
  }
}
