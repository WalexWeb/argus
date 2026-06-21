import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(
    @Query('source') source?: string,
    @Query('event_type') eventType?: string,
    @Query('limit') limit?: string,
  ) {
    let events = this.eventsService.getAll();

    if (source) {
      events = events.filter((e) => e.source === source);
    }
    if (eventType) {
      events = events.filter((e) => e.event_type === eventType);
    }
    if (limit) {
      events = events.slice(0, parseInt(limit, 10));
    }

    return { total: events.length, events };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const event = this.eventsService.getById(id);
    if (!event) {
      return { error: 'Event not found' };
    }
    return event;
  }
}
