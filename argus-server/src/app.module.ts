import { Module, OnModuleInit } from '@nestjs/common';
import { CorrelationModule } from './modules/correlation/correlation.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventsModule } from './modules/events/events.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { IngestionService } from './modules/ingestion/ingestion.service';
import { CorrelationService } from './modules/correlation/correlation.service';
import { EventsService } from './modules/events/events.service';

@Module({
  imports: [
    EventsModule,
    IngestionModule,
    CorrelationModule,
    DashboardModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly correlationService: CorrelationService,
    private readonly eventsService: EventsService,
  ) {}

  onModuleInit() {
    this.eventsService.clear();
    this.ingestionService.loadMockLogs();
    this.correlationService.runCorrelation();
  }
}
