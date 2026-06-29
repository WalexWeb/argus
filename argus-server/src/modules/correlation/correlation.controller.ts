import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Alert } from '../../common/schemas/event.schema';
import { EventsService } from '../events/events.service';
import { AlertsService, CorrelationService } from './correlation.service';

function enrichAlert(alert: Alert) {
  const entityKeys = ['ip', 'username', 'email', 'src_ip', 'countries'];
  const entityCount = entityKeys.filter((k) => alert.evidence[k] != null).length;

  const severityBase = {
    critical: { confidence: 0.92, risk: 0.95 },
    high: { confidence: 0.82, risk: 0.78 },
    medium: { confidence: 0.68, risk: 0.55 },
    low: { confidence: 0.45, risk: 0.3 },
  }[alert.severity];

  const eventBoost = Math.min(alert.related_events.length * 0.02, 0.08);

  return {
    ...alert,
    status: 'open' as const,
    entity_count: Math.max(entityCount, 1),
    confidence_score: Math.min(
      Math.round((severityBase.confidence + eventBoost) * 100),
      99,
    ),
    risk_score: Math.min(
      Math.round((severityBase.risk + eventBoost) * 100),
      99,
    ),
  };
}

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly eventsService: EventsService,
  ) {}

  @Get()
  findAll(@Query('severity') severity?: string) {
    const alerts = severity
      ? this.alertsService.getBySeverity(severity)
      : this.alertsService.getAll();

    return { total: alerts.length, alerts: alerts.map(enrichAlert) };
  }

  @Get(':id/timeline')
  getTimeline(@Param('id', ParseIntPipe) id: number) {
    const alert = this.alertsService.getAll().find((a) => a.id === id);
    if (!alert) {
      return { error: 'Alert not found' };
    }

    const events = alert.related_events
      .map((eventId) => this.eventsService.getById(eventId))
      .filter((e): e is NonNullable<typeof e> => e != null)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .map((e) => this.eventsService.enrichEvent(e));

    return {
      alert: enrichAlert(alert),
      events,
    };
  }
}

@Controller('rules')
export class RulesController {
  constructor(private readonly correlationService: CorrelationService) {}

  @Get()
  findAll() {
    return { rules: this.correlationService.getRules() };
  }
}
