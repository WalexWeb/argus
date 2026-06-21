import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import {
  AlertsService,
  CorrelationService,
} from './correlation.service';
import { AlertsController, RulesController } from './correlation.controller';

@Module({
  imports: [EventsModule],
  controllers: [AlertsController, RulesController],
  providers: [AlertsService, CorrelationService],
  exports: [AlertsService, CorrelationService],
})
export class CorrelationModule {}
