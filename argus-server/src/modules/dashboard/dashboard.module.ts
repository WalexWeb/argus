import { Module } from '@nestjs/common';
import { CorrelationModule } from '../correlation/correlation.module';
import { EventsModule } from '../events/events.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [EventsModule, CorrelationModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
