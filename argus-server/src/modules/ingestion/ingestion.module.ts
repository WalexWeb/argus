import { Module } from '@nestjs/common';
import { CorrelationModule } from '../correlation/correlation.module';
import { EventsModule } from '../events/events.module';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [EventsModule, CorrelationModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
