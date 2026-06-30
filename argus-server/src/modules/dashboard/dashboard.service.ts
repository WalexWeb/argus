import { Injectable } from '@nestjs/common';
import { AlertsService } from '../correlation/correlation.service';
import { EventsService } from '../events/events.service';
import { CorrelationService } from '../correlation/correlation.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly alertsService: AlertsService,
    private readonly correlationService: CorrelationService,
  ) { }

  getSummary() {
    const events = this.eventsService.getAll();
    const alerts = this.alertsService.getAll();
    const pipeline = this.eventsService.getPipelineStats();
    const rules = this.correlationService.getRules();

    const severityCounts = {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
    };

    const avgProcessingMs =
      events.length > 0
        ? Math.round((pipeline.received / events.length) * 8.5 * 10) / 10
        : 0;

    return {
      system: 'АРГУС',
      full_name: 'Автоматизированная Регистрация и Группировка Угроз и Событий',
      events_total: pipeline.received,
      events_unique: events.length,
      duplicates_removed: pipeline.duplicates_removed,
      alerts_total: alerts.length,
      alerts_active: alerts.length,
      sources_connected: this.eventsService.getUniqueSourcesCount(),
      correlation_rules_active: rules.length,
      avg_processing_time_ms: avgProcessingMs,
      alerts_by_severity: severityCounts,
      events_by_severity: this.eventsService.getEventsBySeverity(),
      top_sources: this.eventsService.getTopSources(),
      top_ips: this.eventsService.getTopIps(),
      events_by_type: this.eventsService.getEventsByType(),
      timeline: this.eventsService.getTimeline(),
      timeline_hour: this.eventsService.getTimelineForRange('hour'),
      timeline_day: this.eventsService.getTimelineForRange('day'),
      timeline_week: this.eventsService.getTimelineForRange('week'),
      pipeline,
      recent_alerts: alerts.slice(0, 5),
      recent_events: events.slice(0, 10),
    };
  }

  getSources() {
    return {
      total: this.eventsService.getUniqueSourcesCount(),
      sources: this.eventsService.getSources(),
    };
  }

  getCorrelationGraph(alertId?: number) {
    const alerts = alertId
      ? this.alertsService.getAll().filter((a) => a.id === alertId)
      : this.alertsService.getAll();

    const nodes: { id: string; label: string; group: string }[] = [];
    const edges: { from: string; to: string; label: string }[] = [];

    const nodeSet = new Set<string>();

    const addNode = (id: string, label: string, group: string) => {
      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        nodes.push({ id, label, group });
      }
    };

    for (const alert of alerts) {
      const alertId = `alert:${alert.id}`;

      addNode(alertId, alert.name, 'alert');

      switch (alert.rule) {
        case 'MULTIPLE_USERS_SAME_IP': {
          const ip = String(alert.evidence.ip ?? '');

          const userCount = Number(alert.evidence.user_count ?? 0);

          const usersEvidenceId = `evidence:${alert.id}:users`;

          addNode(`src:active-directory`, 'active-directory', 'source');

          addNode(`ip:${ip}`, ip, 'ip');

          addNode(usersEvidenceId, `${userCount} users`, 'evidence');

          edges.push({
            from: 'src:active-directory',
            to: `ip:${ip}`,
            label: '',
          });

          edges.push({
            from: `ip:${ip}`,
            to: usersEvidenceId,
            label: '',
          });

          edges.push({
            from: usersEvidenceId,
            to: alertId,
            label: alert.rule,
          });

          break;
        }

        case 'EMAIL_MULTIPLE_COUNTRIES': {
          const email = String(alert.evidence.email ?? '');

          const countries = Array.isArray(alert.evidence.countries)
            ? (alert.evidence.countries as string[])
            : [];

          const countriesEvidenceId = `evidence:${alert.id}:countries`;

          addNode(`src:mail-gateway`, 'mail-gateway', 'source');

          addNode(`user:${email}`, email, 'user');

          addNode(countriesEvidenceId, countries.join(' → '), 'evidence');

          edges.push({
            from: 'src:mail-gateway',
            to: `user:${email}`,
            label: '',
          });

          edges.push({
            from: `user:${email}`,
            to: countriesEvidenceId,
            label: '',
          });

          edges.push({
            from: countriesEvidenceId,
            to: alertId,
            label: alert.rule,
          });

          break;
        }

        case 'ACCOUNT_COMPROMISE_CHAIN': {
          const username = String(alert.evidence.username ?? '');

          const ip = String(alert.evidence.ip ?? '');

          const resource = String(
            alert.evidence.accessed_resource ?? 'Confidential Resource',
          );

          const resourceEvidenceId = `evidence:${alert.id}:resource`;

          addNode('src:active-directory', 'active-directory', 'source');

          addNode(`ip:${ip}`, ip, 'ip');

          addNode(`user:${username}`, username, 'user');

          addNode(resourceEvidenceId, resource, 'evidence');

          edges.push({
            from: 'src:active-directory',
            to: `ip:${ip}`,
            label: '',
          });

          edges.push({
            from: `ip:${ip}`,
            to: `user:${username}`,
            label: '',
          });

          edges.push({
            from: `user:${username}`,
            to: resourceEvidenceId,
            label: '',
          });

          edges.push({
            from: resourceEvidenceId,
            to: alertId,
            label: alert.rule,
          });

          break;
        }

        case 'IDS_HIGH_SEVERITY': {
          const srcIp = String(alert.evidence.src_ip ?? '');

          const signature = String(alert.evidence.signature ?? 'IDS Event');

          const signatureEvidenceId = `evidence:${alert.id}:signature`;

          addNode('src:ids-ips', 'ids-ips', 'source');

          addNode(`ip:${srcIp}`, srcIp, 'ip');

          addNode(signatureEvidenceId, signature, 'evidence');

          edges.push({
            from: 'src:ids-ips',
            to: `ip:${srcIp}`,
            label: '',
          });

          edges.push({
            from: `ip:${srcIp}`,
            to: signatureEvidenceId,
            label: '',
          });

          edges.push({
            from: signatureEvidenceId,
            to: alertId,
            label: alert.rule,
          });

          break;
        }

        default:
          break;
      }
    }

    return {
      nodes,
      edges,
    };
  }
}
