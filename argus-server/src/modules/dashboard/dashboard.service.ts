import { Injectable } from '@nestjs/common';
import { AlertsService } from '../correlation/correlation.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly alertsService: AlertsService,
  ) {}

  getSummary() {
    const events = this.eventsService.getAll();
    const alerts = this.alertsService.getAll();

    const severityCounts = {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
    };

    return {
      system: 'АРГУС',
      full_name:
        'Автоматизированная Регистрация и Группировка Угроз и Событий',
      events_total: events.length,
      alerts_total: alerts.length,
      alerts_by_severity: severityCounts,
      top_sources: this.eventsService.getTopSources(),
      top_ips: this.eventsService.getTopIps(),
      events_by_type: this.eventsService.getEventsByType(),
      timeline: this.eventsService.getTimeline(),
      recent_alerts: alerts.slice(0, 5),
      recent_events: events.slice(0, 10),
    };
  }

  getCorrelationGraph() {
    const events = this.eventsService.getAll();
    const alerts = this.alertsService.getAll();

    const nodes: { id: string; label: string; group: string }[] = [];
    const edges: { from: string; to: string; label: string }[] = [];
    const nodeSet = new Set<string>();

    const addNode = (id: string, label: string, group: string) => {
      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        nodes.push({ id, label, group });
      }
    };

    for (const e of events) {
      if (e.ip) addNode(`ip:${e.ip}`, e.ip, 'ip');
      if (e.username) addNode(`user:${e.username}`, e.username, 'user');
      addNode(`src:${e.source}`, e.source, 'source');

      if (e.ip && e.username) {
        edges.push({
          from: `ip:${e.ip}`,
          to: `user:${e.username}`,
          label: e.event_type,
        });
      }
      if (e.source && e.ip) {
        edges.push({
          from: `src:${e.source}`,
          to: `ip:${e.ip}`,
          label: e.event_type,
        });
      }
    }

    for (const alert of alerts) {
      addNode(`alert:${alert.id}`, alert.name, 'alert');
      for (const eventId of alert.related_events) {
        const event = this.eventsService.getById(eventId);
        if (!event) continue;
        if (event.ip) {
          edges.push({
            from: `alert:${alert.id}`,
            to: `ip:${event.ip}`,
            label: alert.rule,
          });
        }
        if (event.username) {
          edges.push({
            from: `alert:${alert.id}`,
            to: `user:${event.username}`,
            label: alert.rule,
          });
        }
      }
    }

    return { nodes, edges };
  }
}
