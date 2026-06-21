import { Controller, Get, Query } from '@nestjs/common';
import { AlertsService, CorrelationService } from './correlation.service';

@Controller('api/v1/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(@Query('severity') severity?: string) {
    const alerts = severity
      ? this.alertsService.getBySeverity(severity)
      : this.alertsService.getAll();

    return { total: alerts.length, alerts };
  }
}

@Controller('api/v1/rules')
export class RulesController {
  constructor(private readonly correlationService: CorrelationService) {}

  @Get()
  findAll() {
    return { rules: this.correlationService.getRules() };
  }
}
