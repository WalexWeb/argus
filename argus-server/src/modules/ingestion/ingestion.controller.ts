import {
  Body,
  Controller,
  Get,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { IngestEventDtoSchema } from '../../common/schemas/event.schema';
import { EventsService } from '../events/events.service';
import { CorrelationService } from '../correlation/correlation.service';
import { IngestionService } from './ingestion.service';

@Controller('api/v1/ingest')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly eventsService: EventsService,
    private readonly correlationService: CorrelationService,
  ) {}

  @Post('mock')
  loadMockLogs() {
    this.eventsService.clear();
    const loadResult = this.ingestionService.loadMockLogs();
    const alerts = this.correlationService.runCorrelation();

    return {
      message: 'Моковые логи загружены и проанализированы',
      ...loadResult,
      alerts_generated: alerts.length,
      alerts,
    };
  }

  @Post('event')
  ingestEvent(@Body() body: unknown) {
    const parsed = IngestEventDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const normalized = this.ingestionService.ingestDto(parsed.data);
    const stored = this.eventsService.ingest(normalized);

    if (!stored) {
      return { message: 'Дубликат события, пропущено', duplicate: true };
    }

    const alerts = this.correlationService.runCorrelation();

    return {
      message: 'Событие принято',
      event: stored,
      alerts_generated: alerts.length,
    };
  }

  @Get('status')
  status() {
    return {
      events_count: this.eventsService.count(),
      rules_count: this.correlationService.getRules().length,
    };
  }
}
