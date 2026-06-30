import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('sources')
  getSources() {
    return this.dashboardService.getSources();
  }

  @Get('correlation-graph')
  getCorrelationGraph(@Query('alertId') alertId?: string) {
    const id = alertId ? Number(alertId) : undefined;
    return this.dashboardService.getCorrelationGraph(id);
  }
}
