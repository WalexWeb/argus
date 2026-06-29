import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('/events')
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

    return { total: events.length, events: events.map((e) => this.eventsService.enrichEvent(e)) };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const event = this.eventsService.getById(id);
    if (!event) {
      return { error: 'Event not found' };
    }
    return this.eventsService.enrichEvent(event);
  }
}
